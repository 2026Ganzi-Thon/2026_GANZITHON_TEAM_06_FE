import { Scene } from 'phaser';

import { REACTION_FEEDBACK_MS } from '../../data/waitingRoomBroadcast';
import { EventBus } from '../EventBus';
import { WAITING_ROOM_DEMO_OCCUPANTS } from '../objects/waitingRoomDemoOccupants';
import {
    getBenchSeatTexture,
    getBenchSeatWorldYNudge,
    getPlayerSeatTexture,
    getPlayerWoolTexture,
    getWoolTextureForBench,
    PLAYER_BENCH_ANCHOR,
    PLAYER_BENCH_SEAT_INDEX,
    PLAYER_SEATED_DIRECTION,
    WAITING_ROOM_BENCH_SLOTS,
    WAITING_ROOM_BENCH_WIDTH_TEXTURE
} from '../objects/waitingRoomBenches';
import { countPassedTrains, msUntilNextTrain, readOnboardingTrip } from '../onboardingSession';
import {
    getReactionEmoji,
    WAITING_ROOM_BIND_LOCAL_PLAYER,
    WAITING_ROOM_REACTION_EVENT,
    WAITING_ROOM_REACTION_REMOTE
} from '../waitingRoomReactionEvents';
import { markWaitingRoomEntered, shouldPlayWaitingRoomEntrance } from '../waitingRoomEntry';

const ROOM_TEXTURE_WIDTH = 1442;
const ROOM_TEXTURE_HEIGHT = 841;
const MOBILE_MAX_HEIGHT = 520; // style.css의 가로 모바일 기준(520px)과 같은 값
const WALK_MS = 1200;
const SIT_MS = 1800;
const TURN_MS = 450;
const PLAYER_SEAT_WORLD_Y_NUDGE = 13;

// 창문 밖 열차 (배경 텍스처 기준 중심 좌표·너비). 위치는 여기서 조정한다.
const TRAIN_TEXTURE = { y: 225, width: 330 };
// 연기: 열차 중심 기준 굴뚝 위 위치(텍스처 px)와 연기 너비. 굴뚝은 열차 왼쪽 앞부분에 있다.
const STEAM_OFFSET = { x: -80, y: -48, width: 40 };
// 열차가 창 오른쪽 밖에서 왼쪽 밖으로 지나가는 x 범위(텍스처 기준)와 시간.
const TRAIN_START_X = 1058 + TRAIN_TEXTURE.width / 2;
const TRAIN_END_X = 388 - TRAIN_TEXTURE.width / 2;
const TRAIN_PASS_MS = 10000;

// 책장 위 벽에 거는 시계 (배경 텍스처 기준, 시계 그림의 아랫변 중심 좌표). 위치는 여기서 조정한다.
// x는 양옆 벽등 사이의 가운데, y는 벽지(나무 장식 아래~걸레받이 위)의 세로 가운데에 시계가 오도록 잡았다.
const CLOCKS = [{ x: 200, y: 175 }, { x: 1252, y: 175 }];
const CLOCK_WIDTH = 126; // clock.png 한 장의 너비(텍스처 px). 둘레가 투명해서 실제 시계는 약 44% 크기다.
const CLOCK_ORIGIN = { x: 231.5 / 512, y: 394 / 512 }; // clock.png(512x512) 안 시계 그림의 아랫변 중심

// 열차 위에 덮는 창틀 (배경 텍스처 기준 윗변 중심 좌표·너비). 위치는 여기서 조정한다.
const WINDOW_TEXTURE = { x: 726, y: 15, width: 760 };

// 열차가 보이는 창문 전체 영역 (배경 텍스처 기준 x1, x2, y1, y2). 기둥·창살은 위에 덮은 창틀이 가린다.
const TRAIN_WINDOW_AREA = [388, 1058, 90, 318];

// 확정 배경 기준 문·플레이어 착석 (좌측 앞 벤치)
// 플레이어 자리 옆에 놓이는 털실 (너비·벤치와의 간격, 배경 텍스처 px). 위치는 여기서 조정한다.
const WOOL = { width: 68, gap: 6, mobileScale: 1.3, labelFontSize: 14, lift: 12, lift02: 8 };
// mobileScale: 모바일은 배경이 작게 보여 털실을 더 키운다 / lift: 벤치 하단보다 위로 올리는 거리(텍스처 px)

// 털실 위치 확인용 디버그. 확인할 때만 true로 바꾸고, 커밋하기 전에 false로 되돌린다.
const DEBUG_WOOL_POSITIONS = false;

const ENTRANCE_TEXTURE = { x: 721, y: 755 };

export class WaitingRoom extends Scene
{
    constructor ()
    {
        super('WaitingRoom');
    }

    create ()
    {
        this.roomImage = this.add.image(0, 0, 'waiting-room');
        this.clocks = CLOCKS.map(() => this.add.image(0, 0, 'clock').setOrigin(CLOCK_ORIGIN.x, CLOCK_ORIGIN.y).setDepth(0.5));
        this.roomScale = 1;
        this.roomOffsetX = 0;
        this.roomOffsetY = 0;
        this.train = this.add.image(0, 0, 'train').setOrigin(0.5);
        // 창문 유리 영역 밖은 열차를 잘라낸다. 마스크 도형은 화면에 그리지 않는다.
        this.trainMaskShape = this.make.graphics({ add: false });
        this.train.enableFilters();
        this.train.filters.external.addMask(this.trainMaskShape, false, this.cameras.main);
        this.trainTextureX = TRAIN_START_X;

        // 굴뚝 연기: steam-0~11을 차례로 반복 재생하고, 열차와 같은 마스크로 창 밖에서는 잘라낸다.
        this.anims.create({
            key: 'steam',
            frames: Array.from({ length: 12 }, (_, frame) => ({ key: `steam-${frame}` })),
            frameRate: 8,
            repeat: -1
        });
        this.steam = this.add.sprite(0, 0, 'steam-0').setOrigin(0.5, 1);
        this.steam.enableFilters();
        this.steam.filters.external.addMask(this.trainMaskShape, false, this.cameras.main);
        this.steam.play('steam');
        this.windowFrame = this.add.image(0, 0, 'window').setOrigin(0.5, 0);
        this.wool = this.add.image(0, 0, 'wool01').setOrigin(0.5, 1).setVisible(false);
        // 털실이 나타날 때의 등장 진행도(0~1). 1이면 평소 모습이다.
        this.woolIntro = 1;
        // 털실이 한 올 쌓이기 전(wool01)에는 누를 수 없고, 쌓이면 wool02로 바뀌어 누르면 털실 톡톡이 열린다.
        this.wool.on('pointerdown', () =>
        {
            // 털실톡톡 패널을 열도록 React에 알립니다.
            EventBus.emit('wool-tok-open');
        });
        // DEBUG_WOOL_POSITIONS를 true로 바꾸면 모든 벤치 옆 털실 위치를 번호와 함께 보여 준다 (위치 확인용).
        this.debugWools = [];
        if (DEBUG_WOOL_POSITIONS)
        {
            this.debugWools = WAITING_ROOM_BENCH_SLOTS.map((slot, index) => ({
                slot,
                image: this.add.image(0, 0, 'wool01').setOrigin(0.5, 1),
                label: this.add.text(0, 0, String(index), { fontSize: '14px', color: '#ffffff', backgroundColor: '#000000' }).setOrigin(0.5, 1)
            }));
        }
        this.benches = [];
        this._atBenchSeat = false;
        this.localTicketId = null;
        this.occupantsByTicketId = new Map();
        this.reactionEmojisByTicketId = new Map();
        this._panX = null;
        this._panY = null;
        this._canPanX = false;
        this._canPanY = false;

        this.updateRoomLayout();
        this.scale.on('resize', this.updateRoomLayout, this);

        // 배경이 화면보다 클 때(모바일) 드래그·휠로 위아래로 스크롤한다.
        this.input.on('pointermove', this.handlePanDrag, this);
        this.input.on('wheel', this.handlePanWheel, this);

        // 열차는 평소엔 창 밖에 있다가, 30분(서버 간격)마다 한 번 오른쪽에서 왼쪽으로 지나간다.
        this.scheduleTrain();

        // 열차가 지나가 털실이 쌓였는지 1초마다 확인해 털실 모양을 바꾼다.
        this.updateWoolState();
        this.time.addEvent({ delay: 1000, loop: true, callback: () => this.updateWoolState() });

        this.createWalkAnimations();
        this.createBenches();
        this.spawnPlayer();
        this.spawnDemoOccupants();
        this.handleBenchLayoutRefresh = () => this.refreshBenchLayoutFromModule();

        EventBus.on('refresh-waiting-room-bench-layout', this.handleBenchLayoutRefresh);
        this.handleWaitingRoomReaction = (payload) =>
        {
            this.showReactionForOccupant(payload?.ticketId, payload?.reactionType);
        };
        this.handleBindLocalPlayer = (payload) => this.bindLocalPlayerTicket(payload?.ticketId);
        EventBus.on(WAITING_ROOM_REACTION_EVENT, this.handleWaitingRoomReaction);
        EventBus.on(WAITING_ROOM_REACTION_REMOTE, this.handleWaitingRoomReaction);
        EventBus.on(WAITING_ROOM_BIND_LOCAL_PLAYER, this.handleBindLocalPlayer);

        // 도안을 전달하면 털실이 wool03으로 바뀌고, 더 이상 누를 수 없다.
        this.handleWoolDeliver = () =>
        {
            this.isWoolDelivered = true;
            this.wool.setTexture('wool03');
            this.wool.disableInteractive();
            this.layoutWool();
        };
        EventBus.on('wool-deliver', this.handleWoolDeliver);

        EventBus.emit('current-scene-ready', this);
    }

    shutdown ()
    {
        if (this.handleBenchLayoutRefresh)
        {
            EventBus.off('refresh-waiting-room-bench-layout', this.handleBenchLayoutRefresh);
        }

        if (this.handleWaitingRoomReaction)
        {
            EventBus.off(WAITING_ROOM_REACTION_EVENT, this.handleWaitingRoomReaction);
            EventBus.off(WAITING_ROOM_REACTION_REMOTE, this.handleWaitingRoomReaction);
        }

        if (this.handleBindLocalPlayer)
        {
            EventBus.off(WAITING_ROOM_BIND_LOCAL_PLAYER, this.handleBindLocalPlayer);
        }

        this.clearAllReactionEmojis();
        this.occupantsByTicketId.clear();
        EventBus.off('wool-deliver', this.handleWoolDeliver);
        this.scale.off('resize', this.updateRoomLayout, this);
        this.input.off('pointermove', this.handlePanDrag, this);
        this.input.off('wheel', this.handlePanWheel, this);
    }

    panBy (deltaX, deltaY)
    {
        if (!this._canPanX && !this._canPanY)
        {
            return;
        }

        if (this._canPanX)
        {
            this._panX = this.roomOffsetX + deltaX;
        }

        if (this._canPanY)
        {
            this._panY = this.roomOffsetY + deltaY;
        }

        this.updateRoomLayout();
    }

    handlePanDrag (pointer)
    {
        if (pointer.isDown)
        {
            this.panBy(pointer.x - pointer.prevPosition.x, pointer.y - pointer.prevPosition.y);
        }
    }

    handlePanWheel (pointer, objects, deltaX, deltaY)
    {
        this.panBy(-deltaX, -deltaY);
    }

    refreshBenchLayoutFromModule ()
    {
        import('../objects/waitingRoomBenches').then((mod) =>
        {
            this.layoutBenches(mod.WAITING_ROOM_BENCH_SLOTS);

            if (!this.player?.active)
            {
                return;
            }

            const seat = this.getPlayerSeatWorld(mod.getPlayerSeatTexture);

            this.player.setPosition(seat.x, seat.y);
            this.syncPlayerDepth();
            this.layoutDemoOccupants();
        });
    }

    // 받은 털실(= 지나간 열차)이 1올 이상이면 wool02(누를 수 있음), 아니면 wool01. 전달한 뒤에는 wool03을 유지한다.
    updateWoolState ()
    {
        if (this.isWoolDelivered)
        {
            return;
        }

        const hasYarn = (countPassedTrains(readOnboardingTrip()) ?? 0) >= 1;
        const key = hasYarn ? 'wool02' : 'wool01';

        if (this.wool.texture.key === key)
        {
            return;
        }

        this.wool.setTexture(key);

        if (hasYarn)
        {
            this.wool.setInteractive({ useHandCursor: true });
        }
        else
        {
            this.wool.disableInteractive();
        }

        this.layoutWool();
    }

    scheduleTrain ()
    {
        const delay = msUntilNextTrain(readOnboardingTrip());

        if (delay === null)
        {
            return;
        }

        this.trainTimer = this.time.delayedCall(delay, () =>
        {
            this.playTrainPass();
            this.scheduleTrain();
        });
    }

    playTrainPass ()
    {
        // 열차가 지나갔다는 안내를 React가 띄우도록 알립니다.
        EventBus.emit('train-passed');
        this.trainTextureX = TRAIN_START_X;
        this.tweens.add({
            targets: this,
            trainTextureX: TRAIN_END_X,
            duration: TRAIN_PASS_MS,
            onUpdate: () =>
            {
                const x = this.textureToWorld(this.trainTextureX, 0).x;

                this.train.setX(x);
                this.steam.setX(x + STEAM_OFFSET.x * this.roomScale);
            }
        });
    }

    updateRoomLayout ()
    {
        const viewWidth = this.scale.width;
        const viewHeight = this.scale.height;

        const fitWidth = viewWidth / ROOM_TEXTURE_WIDTH;
        const fitHeight = viewHeight / ROOM_TEXTURE_HEIGHT;
        // 모바일(세로 화면, 또는 높이가 낮은 가로 화면)은 꽉 채우고, 그 외에는 배경 전체가 보이게 한다.
        const isPortrait = viewHeight > viewWidth || viewHeight <= MOBILE_MAX_HEIGHT;

        this.roomScale = isPortrait ? Math.max(fitWidth, fitHeight) : Math.min(fitWidth, fitHeight);

        const roomWidth = ROOM_TEXTURE_WIDTH * this.roomScale;
        const roomHeight = ROOM_TEXTURE_HEIGHT * this.roomScale;

        this.roomOffsetX = (viewWidth - roomWidth) / 2;
        this.roomOffsetY = (viewHeight - roomHeight) / 2;

        if (isPortrait)
        {
            // 잘리는 범위에서 플레이어 자리가 항상 보이도록 가운데를 맞춘다.
            const seat = getPlayerSeatTexture();

            // 좌우는 처음엔 플레이어 자리를 가운데로, 드래그하면 그만큼 움직인다.
            this.roomOffsetX = Math.min(0, Math.max(viewWidth - roomWidth, this._panX ?? viewWidth / 2 - seat.x * this.roomScale));
            const minOffsetY = viewHeight - roomHeight;

            // 세로는 배경 맨 위에서 시작한다. 안내판은 배경 위쪽에 붙어 있어서 아래로 내리면 같이 올라간다.
            this.roomOffsetY = Math.min(0, Math.max(minOffsetY, this._panY ?? 0));
        }

        this.isMobileLayout = isPortrait;
        this._canPanX = isPortrait && roomWidth > viewWidth;
        this._canPanY = isPortrait && roomHeight > viewHeight;

        // 배경이 스크롤된 만큼 React 안내판도 같이 움직이도록 알린다.
        EventBus.emit('room-pan', this._canPanY ? this.roomOffsetY : 0);

        this.roomImage.setOrigin(0);
        this.roomImage.setScale(this.roomScale);
        this.roomImage.setPosition(this.roomOffsetX, this.roomOffsetY);
        this.roomImage.setDepth(0);

        this.clocks.forEach((clock, index) =>
        {
            const pos = this.textureToWorld(CLOCKS[index].x, CLOCKS[index].y);

            clock.setPosition(pos.x, pos.y).setScale((CLOCK_WIDTH * this.roomScale) / clock.width);
        });

        const train = this.textureToWorld(this.trainTextureX, TRAIN_TEXTURE.y);

        this.train.setPosition(train.x, train.y);
        this.train.setScale((TRAIN_TEXTURE.width * this.roomScale) / this.train.width);
        this.train.setDepth(1);

        this.steam.setPosition(train.x + STEAM_OFFSET.x * this.roomScale, train.y + STEAM_OFFSET.y * this.roomScale);
        this.steam.setScale((STEAM_OFFSET.width * this.roomScale) / this.steam.width);
        this.steam.setDepth(1);

        const windowPos = this.textureToWorld(WINDOW_TEXTURE.x, WINDOW_TEXTURE.y);

        this.windowFrame.setPosition(windowPos.x, windowPos.y);
        this.windowFrame.setScale((WINDOW_TEXTURE.width * this.roomScale) / this.windowFrame.width);
        this.windowFrame.setDepth(2);

        this.trainMaskShape.clear().fillStyle(0xffffff);
        const [x1, x2, y1, y2] = TRAIN_WINDOW_AREA;
        const areaTopLeft = this.textureToWorld(x1, y1);

        this.trainMaskShape.fillRect(areaTopLeft.x, areaTopLeft.y, (x2 - x1) * this.roomScale, (y2 - y1) * this.roomScale);

        this.layoutBenches();

        if (this.player?.active)
        {
            const seat = this.getPlayerSeatWorld();

            this.player.setPosition(seat.x, seat.y);
            this.syncPlayerDepth();
            this.layoutDemoOccupants();
            this.syncAllReactionEmojiPositions();
        }

        this.layoutWool();
    }

    // 캐릭터가 앉으면 털실이 작게 시작해 통통 튀며 나타난다.
    revealWool ()
    {
        this.wool.setVisible(true);
        this.woolIntro = 0;
        this.layoutWool();
        this.tweens.add({
            targets: this,
            woolIntro: 1,
            duration: 650,
            ease: 'Back.easeOut',
            onUpdate: () => this.layoutWool()
        });
    }

    // 털실을 플레이어가 앉은 벤치 옆에 놓는다.
    layoutWool ()
    {
        const width = this.isMobileLayout ? WOOL.width * WOOL.mobileScale : WOOL.width;
        const wool = getPlayerWoolTexture(width, WOOL.gap);
        const pos = this.textureToWorld(wool.x, wool.y - WOOL.lift);
        // wool02/wool03일 때는 이미지만 더 위로 올리고, 라벨 위치(pos)는 그대로 둔다.
        const extraLift = this.wool.texture.key !== 'wool01' ? WOOL.lift02 * this.roomScale : 0;

        // 등장 중에는 작고 흐릿하게 아래에서 시작해 통통 튀며 자리를 잡는다.
        const intro = this.woolIntro;

        this.wool.setPosition(pos.x, pos.y - extraLift + (1 - intro) * 16 * this.roomScale);
        this.wool.setScale(((width * this.roomScale) / this.wool.width) * intro);
        this.wool.setAlpha(Math.min(1, intro * 2));
        this.wool.setDepth(this.getSeatedPlayerDepth());

        // 라벨은 React가 그린다. 위치(캔버스 px)와 글자 크기만 알려준다.
        const fontSize = Math.max(11, Math.round(WOOL.labelFontSize * this.roomScale * (this.isMobileLayout ? WOOL.mobileScale : 1)));

        EventBus.emit('wool-label', { x: pos.x, y: pos.y, fontSize, visible: this.wool.visible && intro > 0.6 });

        this.debugWools.forEach(({ slot, image, label }) =>
        {
            const woolPos = getWoolTextureForBench(slot, width, WOOL.gap);
            const world = this.textureToWorld(woolPos.x, woolPos.y - WOOL.lift);

            image.setPosition(world.x, world.y).setScale((width * this.roomScale) / image.width).setDepth(100);
            label.setPosition(world.x, world.y).setDepth(101);
        });
    }

    bindLocalPlayerTicket (ticketId)
    {
        if (ticketId == null)
        {
            return;
        }

        this.localTicketId = ticketId;

        if (this.player?.active)
        {
            this.registerOccupant(ticketId, this.player, { isLocal: true });
        }
    }

    registerOccupant (ticketId, sprite, options = {})
    {
        if (ticketId == null || !sprite?.active)
        {
            return;
        }

        this.occupantsByTicketId.set(ticketId, {
            sprite,
            isLocal: Boolean(options.isLocal),
            seatConfig: options.seatConfig ?? null
        });
    }

    spawnDemoOccupants ()
    {
        WAITING_ROOM_DEMO_OCCUPANTS.forEach((config) =>
        {
            const slot = WAITING_ROOM_BENCH_SLOTS[config.benchSlotIndex];

            if (!slot)
            {
                return;
            }

            const seat = this.getSeatWorldFromBench(config.benchSlotIndex, config.seatIndex);
            const sprite = this.add.sprite(seat.x, seat.y, `sit-${config.sitDirection}`);

            sprite.setOrigin(0.5, 1);
            sprite.setDepth(this.getSeatedSpriteDepth(seat.y, slot));

            this.registerOccupant(config.ticketId, sprite, {
                isLocal: false,
                seatConfig: {
                    benchSlotIndex: config.benchSlotIndex,
                    seatIndex: config.seatIndex
                }
            });
        });
    }

    getSeatWorldFromBench (benchSlotIndex, seatIndex)
    {
        const slot = WAITING_ROOM_BENCH_SLOTS[benchSlotIndex];
        const texture = getBenchSeatTexture(slot, seatIndex);
        const world = this.textureToWorld(texture.x, texture.y);

        world.y += PLAYER_SEAT_WORLD_Y_NUDGE;
        world.y += getBenchSeatWorldYNudge(seatIndex);

        return world;
    }

    layoutDemoOccupants ()
    {
        this.occupantsByTicketId.forEach((occupant) =>
        {
            if (occupant.isLocal || !occupant.seatConfig)
            {
                return;
            }

            const { benchSlotIndex, seatIndex } = occupant.seatConfig;
            const slot = WAITING_ROOM_BENCH_SLOTS[benchSlotIndex];
            const seat = this.getSeatWorldFromBench(benchSlotIndex, seatIndex);

            occupant.sprite.setPosition(seat.x, seat.y);
            occupant.sprite.setDepth(this.getSeatedSpriteDepth(seat.y, slot));
        });
    }

    getSeatedDepthAtBenchFoot (benchSlot)
    {
        const benchFoot = this.textureToWorld(benchSlot.x, benchSlot.y);

        return benchFoot.y + 1;
    }

    getSeatedSpriteDepth (worldFootY, benchSlot)
    {
        const benchDepth = this.getSeatedDepthAtBenchFoot(benchSlot);

        return Math.max(benchDepth + 1, worldFootY + 0.5);
    }

    getSpriteFootDepth (sprite)
    {
        if (sprite === this.player && this.player?.active)
        {
            return this.getSeatedPlayerDepth();
        }

        return sprite.y + 1;
    }

    resolveOccupantSprite (ticketId)
    {
        if (ticketId != null && this.occupantsByTicketId.has(ticketId))
        {
            return this.occupantsByTicketId.get(ticketId).sprite;
        }

        if (this.player?.active)
        {
            return this.player;
        }

        return null;
    }

    reactionKey (ticketId)
    {
        if (ticketId != null)
        {
            return String(ticketId);
        }

        if (this.localTicketId != null)
        {
            return String(this.localTicketId);
        }

        return 'local';
    }

    clearReactionEmoji (ticketId)
    {
        const key = this.reactionKey(ticketId);
        const entry = this.reactionEmojisByTicketId.get(key);

        if (!entry)
        {
            return;
        }

        if (entry.timer)
        {
            entry.timer.remove(false);
        }

        if (entry.text?.active)
        {
            entry.text.destroy();
        }

        this.reactionEmojisByTicketId.delete(key);
    }

    clearAllReactionEmojis ()
    {
        const keys = [...this.reactionEmojisByTicketId.keys()];

        keys.forEach((key) =>
        {
            const ticketId = key === 'local' ? null : Number(key);

            this.clearReactionEmoji(ticketId);
        });
    }

    syncAllReactionEmojiPositions ()
    {
        this.reactionEmojisByTicketId.forEach((entry, key) =>
        {
            const ticketId = key === 'local' ? this.localTicketId : Number(key);
            const sprite = this.resolveOccupantSprite(ticketId);

            if (!sprite?.active || !entry.text?.active)
            {
                return;
            }

            const offsetY = sprite.displayHeight * 0.92;
            const fontSize = Math.max(18, Math.round(26 * this.roomScale));

            entry.text.setPosition(sprite.x, sprite.y - offsetY);
            entry.text.setDepth(this.getSpriteFootDepth(sprite) + 2);
            entry.text.setFontSize(`${fontSize}px`);
        });
    }

    showReactionForOccupant (ticketId, reactionType)
    {
        const sprite = this.resolveOccupantSprite(ticketId);

        if (!sprite?.active || !reactionType)
        {
            return;
        }

        const key = this.reactionKey(ticketId);

        this.clearReactionEmoji(ticketId);

        const emoji = getReactionEmoji(reactionType);
        const offsetY = sprite.displayHeight * 0.92;
        const fontSize = Math.max(18, Math.round(26 * this.roomScale));

        const text = this.add.text(sprite.x, sprite.y - offsetY, emoji, {
            fontFamily: 'Pretendard Variable, Pretendard, Apple Color Emoji, Segoe UI Emoji, sans-serif',
            fontSize: `${fontSize}px`
        });

        text.setOrigin(0.5, 1);
        text.setDepth(this.getSpriteFootDepth(sprite) + 2);
        text.setAlpha(0);

        this.tweens.add({
            targets: text,
            alpha: 1,
            y: text.y - 6,
            duration: 180,
            ease: 'Sine.easeOut'
        });

        const timer = this.time.delayedCall(REACTION_FEEDBACK_MS, () =>
        {
            if (!text.active)
            {
                return;
            }

            this.tweens.add({
                targets: text,
                alpha: 0,
                duration: 200,
                onComplete: () => this.clearReactionEmoji(ticketId)
            });
        });

        this.reactionEmojisByTicketId.set(key, { text, timer });
    }

    getPlayerSeatWorld (getSeatTexture = getPlayerSeatTexture)
    {
        const seatTexture = getSeatTexture();
        const seat = this.textureToWorld(seatTexture.x, seatTexture.y);

        seat.y += PLAYER_SEAT_WORLD_Y_NUDGE;
        seat.y += getBenchSeatWorldYNudge(PLAYER_BENCH_SEAT_INDEX);

        return seat;
    }

    createBenches ()
    {
        const benchTexture = this.textures.get('waiting-room-bench');
        const source = benchTexture.getSourceImage();
        const nativeWidth = source.width;

        const scaleInTexture = WAITING_ROOM_BENCH_WIDTH_TEXTURE / nativeWidth;

        WAITING_ROOM_BENCH_SLOTS.forEach(() =>
        {
            const bench = this.add.image(0, 0, 'waiting-room-bench');
            bench.setOrigin(0.5, 1);
            bench._textureScale = scaleInTexture;
            this.benches.push(bench);
        });

        this.layoutBenches();
    }

    layoutBenches (slots = WAITING_ROOM_BENCH_SLOTS)
    {
        if (!this.benches.length)
        {
            return;
        }

        this.benches.forEach((bench, index) =>
        {
            const slot = slots[index];

            if (!slot)
            {
                return;
            }

            const world = this.textureToWorld(slot.x, slot.y);
            const displayScale = this.roomScale * bench._textureScale;

            bench.setPosition(world.x, world.y);
            bench.setScale(displayScale);
            bench.setFlipX(Boolean(slot.flipX));
            bench.setDepth(world.y - 1);
        });
    }

    spawnPlayer ()
    {
        if (shouldPlayWaitingRoomEntrance())
        {
            const entrance = this.textureToWorld(ENTRANCE_TEXTURE.x, ENTRANCE_TEXTURE.y);

            this.player = this.add.sprite(entrance.x, entrance.y, 'walk-south-west-0');
            this.player.setOrigin(0.5, 1);
            this.player.setDepth(entrance.y);
            this.walkToSeat();
        }
        else
        {
            const seat = this.getPlayerSeatWorld();

            this.placeSeatedPlayer(seat.x, seat.y);
        }
    }

    textureToWorld (textureX, textureY)
    {
        return {
            x: this.roomOffsetX + textureX * this.roomScale,
            y: this.roomOffsetY + textureY * this.roomScale
        };
    }

    getSeatedPlayerDepth ()
    {
        const playerSlot = {
            x: PLAYER_BENCH_ANCHOR.x,
            y: PLAYER_BENCH_ANCHOR.y,
            flipX: false
        };

        if (this.player?.active)
        {
            return this.getSeatedSpriteDepth(this.player.y, playerSlot);
        }

        return this.getSeatedDepthAtBenchFoot(playerSlot);
    }

    syncPlayerDepth ()
    {
        if (!this.player?.active)
        {
            return;
        }

        const isSeated = this.player.texture?.key?.startsWith('sit-');

        if (isSeated || this._atBenchSeat)
        {
            this.player.setDepth(this.getSeatedPlayerDepth());
        }
        else
        {
            this.player.setDepth(this.player.y);
        }
    }

    placeSeatedPlayer (x, y)
    {
        this._atBenchSeat = true;
        this.player = this.add.sprite(x, y, `sit-${PLAYER_SEATED_DIRECTION}`);
        this.player.setOrigin(0.5, 1);
        this.syncPlayerDepth();
        this.bindLocalPlayerTicket(this.localTicketId);
        this.wool.setVisible(true);
        this.layoutWool();
    }

    createWalkAnimations ()
    {
        ['south-east', 'south-west'].forEach((direction) =>
        {
            if (this.anims.exists(`walk-${direction}`))
            {
                return;
            }

            this.anims.create({
                key: `walk-${direction}`,
                frames: [0, 1, 2, 3, 4, 5].map((frame) => ({ key: `walk-${direction}-${frame}` })),
                frameRate: 10,
                repeat: -1
            });
        });
    }

    walkToSeat ()
    {
        const seat = this.getPlayerSeatWorld();

        this._atBenchSeat = false;
        this.player.setOrigin(0.5, 1);
        this.player.play('walk-south-west');
        this.tweens.add({
            targets: this.player,
            x: seat.x,
            y: seat.y,
            duration: WALK_MS,
            onUpdate: () => this.syncPlayerDepth(),
            onComplete: () => this.finishSitting(seat.x, seat.y)
        });
    }

    finishSitting (x, y)
    {
        if (!this.player?.active)
        {
            return;
        }

        this._atBenchSeat = true;
        this.syncPlayerDepth();
        this.player.stop();
        // 멈춘 뒤 우측 아래로 몸 돌림
        this.player.setTexture(`walk-${PLAYER_SEATED_DIRECTION}-0`);

        this.time.delayedCall(TURN_MS, () =>
        {
            if (!this.player?.active)
            {
                return;
            }

            this.player.setTexture(`sit-${PLAYER_SEATED_DIRECTION}`);
            this.player.setOrigin(0.5, 1);
            this.player.setPosition(x, y);
            this.syncPlayerDepth();
            this.bindLocalPlayerTicket(this.localTicketId);
            this.revealWool();

            const sitHoldMs = Math.max(0, SIT_MS - TURN_MS);

            this.time.delayedCall(sitHoldMs, () =>
            {
                if (!this.player?.active)
                {
                    return;
                }

                markWaitingRoomEntered();
                EventBus.emit('passenger-seated');
            });
        });
    }
}

if (import.meta.hot)
{
    import.meta.hot.accept('../objects/waitingRoomBenches', () =>
    {
        EventBus.emit('refresh-waiting-room-bench-layout');
    });
}