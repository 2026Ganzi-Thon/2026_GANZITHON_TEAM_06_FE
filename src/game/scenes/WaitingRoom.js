import { Scene } from 'phaser';

import { EventBus } from '../EventBus';
import {
    getPlayerSeatTexture,
    PLAYER_BENCH_ANCHOR,
    PLAYER_SEATED_DIRECTION,
    WAITING_ROOM_BENCH_SLOTS,
    WAITING_ROOM_BENCH_WIDTH_TEXTURE
} from '../objects/waitingRoomBenches';
import { markWaitingRoomEntered, shouldPlayWaitingRoomEntrance } from '../waitingRoomEntry';

const ROOM_TEXTURE_WIDTH = 1442;
const ROOM_TEXTURE_HEIGHT = 841;
const WALK_MS = 1200;
const SIT_MS = 1800;
const TURN_MS = 450;
const PLAYER_SEAT_WORLD_Y_NUDGE = 5;

// 확정 배경 기준 문·플레이어 착석 (좌측 앞 벤치)
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
        this.roomScale = 1;
        this.roomOffsetX = 0;
        this.roomOffsetY = 0;
        this.benches = [];
        this._atBenchSeat = false;

        this.updateRoomLayout();
        this.scale.on('resize', this.updateRoomLayout, this);

        this.createWalkAnimations();
        this.createBenches();
        this.spawnPlayer();
        this.handleBenchLayoutRefresh = () => this.refreshBenchLayoutFromModule();

        EventBus.on('refresh-waiting-room-bench-layout', this.handleBenchLayoutRefresh);

        EventBus.emit('current-scene-ready', this);
    }

    shutdown ()
    {
        if (this.handleBenchLayoutRefresh)
        {
            EventBus.off('refresh-waiting-room-bench-layout', this.handleBenchLayoutRefresh);
        }

        this.scale.off('resize', this.updateRoomLayout, this);
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
        });
    }

    updateRoomLayout ()
    {
        const viewWidth = this.scale.width;
        const viewHeight = this.scale.height;

        this.roomScale = Math.max(
            viewWidth / ROOM_TEXTURE_WIDTH,
            viewHeight / ROOM_TEXTURE_HEIGHT
        );

        this.roomOffsetX = (viewWidth - ROOM_TEXTURE_WIDTH * this.roomScale) / 2;
        this.roomOffsetY = (viewHeight - ROOM_TEXTURE_HEIGHT * this.roomScale) / 2;

        this.roomImage.setOrigin(0.5);
        this.roomImage.setScale(this.roomScale);
        this.roomImage.setPosition(viewWidth / 2, viewHeight / 2);
        this.roomImage.setDepth(0);

        this.layoutBenches();

        if (this.player?.active)
        {
            const seat = this.getPlayerSeatWorld();

            this.player.setPosition(seat.x, seat.y);
            this.syncPlayerDepth();
        }
    }

    getPlayerSeatWorld (getSeatTexture = getPlayerSeatTexture)
    {
        const seatTexture = getSeatTexture();
        const seat = this.textureToWorld(seatTexture.x, seatTexture.y);

        seat.y += PLAYER_SEAT_WORLD_Y_NUDGE;

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
        // 벤치 depth(world.y - 1)보다 앞에 그리기
        const benchFoot = this.textureToWorld(PLAYER_BENCH_ANCHOR.x, PLAYER_BENCH_ANCHOR.y);

        return benchFoot.y + 1;
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