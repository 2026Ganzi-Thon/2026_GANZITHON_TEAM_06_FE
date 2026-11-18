import { Scene } from 'phaser';

import { REACTION_FEEDBACK_MS } from '../../data/waitingRoomBroadcast';
import { EventBus } from '../EventBus';
import { WAITING_ROOM_DEMO_OCCUPANTS } from '../objects/waitingRoomDemoOccupants';
import {
    getBenchSeatTexture,
    getBenchSeatWorldYNudge,
    getPlayerSeatTexture,
    PLAYER_BENCH_ANCHOR,
    PLAYER_BENCH_SEAT_INDEX,
    PLAYER_SEATED_DIRECTION,
    WAITING_ROOM_BENCH_SLOTS,
    WAITING_ROOM_BENCH_WIDTH_TEXTURE
} from '../objects/waitingRoomBenches';
import {
    getReactionEmoji,
    WAITING_ROOM_BIND_LOCAL_PLAYER,
    WAITING_ROOM_REACTION_EVENT,
    WAITING_ROOM_REACTION_REMOTE
} from '../waitingRoomReactionEvents';
import { markWaitingRoomEntered, shouldPlayWaitingRoomEntrance } from '../waitingRoomEntry';

const ROOM_TEXTURE_WIDTH = 1442;
const ROOM_TEXTURE_HEIGHT = 841;
const WALK_MS = 1200;
const SIT_MS = 1800;
const TURN_MS = 450;
const PLAYER_SEAT_WORLD_Y_NUDGE = 13;

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
        this.localTicketId = null;
        this.occupantsByTicketId = new Map();
        this.reactionEmojisByTicketId = new Map();

        this.updateRoomLayout();
        this.scale.on('resize', this.updateRoomLayout, this);

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
            this.layoutDemoOccupants();
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
            this.layoutDemoOccupants();
            this.syncAllReactionEmojiPositions();
        }
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