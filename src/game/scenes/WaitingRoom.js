import { Scene } from 'phaser';

import { EventBus } from '../EventBus';
import { markWaitingRoomEntered, shouldPlayWaitingRoomEntrance } from '../waitingRoomEntry';

const TILE_SIZE = 32;
const ROOM_WIDTH = 1024;
const ROOM_HEIGHT = 768;
const WALL_ROWS = 5;
const ENTRANCE_WAIT_MS = 1200;
const WALK_MS = 600;

// 문은 아래 가운데. 빈 자리는 그 바로 왼쪽 앞줄이라 0.6초 이동이 짧다.
const ENTRANCE = { x: 512, y: 700 };
const SEAT = { x: 330, y: 670 };

const WINDOW_POSITIONS = [150, 330, 512, 694, 874];
const BENCH_COLUMNS = [170, 330, 694, 854];
const BENCH_ROWS = [250, 390, 530, 670];
const SEAT_DIRECTIONS = ['south', 'south-east', 'south-west', 'east', 'west'];

export class WaitingRoom extends Scene
{
    constructor ()
    {
        super('WaitingRoom');
    }

    create ()
    {
        this.createRoom();
        this.createWindows();
        this.createSeatedPassengers();
        this.addBench(SEAT.x, SEAT.y);
        this.createWalkAnimations();

        if (shouldPlayWaitingRoomEntrance())
        {
            this.player = this.add.sprite(ENTRANCE.x, ENTRANCE.y, 'walk-south-west-0');
            this.player.setDepth(ENTRANCE.y);
            this.time.delayedCall(ENTRANCE_WAIT_MS, () =>
            {
                if (!this.player?.active)
                {
                    return;
                }

                this.walkToSeat();
            });
        }
        else
        {
            this.placeSeatedPlayer();
        }

        EventBus.emit('current-scene-ready', this);
    }

    placeSeatedPlayer ()
    {
        this.player = this.add.sprite(SEAT.x, SEAT.y, 'sit-south');
        this.player.setDepth(SEAT.y);
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
        this.player.play('walk-south-west');
        this.tweens.add({
            targets: this.player,
            x: SEAT.x,
            y: SEAT.y,
            duration: WALK_MS,
            onUpdate: () => this.player.setDepth(this.player.y),
            onComplete: () => this.sitDown()
        });
    }

    sitDown ()
    {
        if (!this.player?.active)
        {
            return;
        }

        this.player.stop();
        this.player.setTexture('sit-south');
        this.player.setDepth(SEAT.y);
        markWaitingRoomEntered();
        EventBus.emit('passenger-seated');
    }

    createRoom ()
    {
        const columns = ROOM_WIDTH / TILE_SIZE;
        const rows = ROOM_HEIGHT / TILE_SIZE;

        for (let row = 0; row < rows; row += 1)
        {
            for (let column = 0; column < columns; column += 1)
            {
                const texture = row < WALL_ROWS ? 'wall' : 'floor';

                this.add.image(
                    column * TILE_SIZE + TILE_SIZE / 2,
                    row * TILE_SIZE + TILE_SIZE / 2,
                    texture
                ).setDepth(0);
            }
        }
    }

    createWindows ()
    {
        WINDOW_POSITIONS.forEach((x) =>
        {
            this.add.image(x, 78, 'window').setDepth(1);
        });
    }

    createSeatedPassengers ()
    {
        let directionIndex = 0;

        BENCH_ROWS.forEach((y) =>
        {
            BENCH_COLUMNS.forEach((x) =>
            {
                if (x === SEAT.x && y === SEAT.y)
                {
                    return;
                }

                this.addBench(x, y);
                const direction = SEAT_DIRECTIONS[directionIndex % SEAT_DIRECTIONS.length];
                const sheep = this.add.sprite(x, y - 16, `sit-${direction}`);

                sheep.setDepth(y);
                directionIndex += 1;
            });
        });
    }

    addBench (x, y)
    {
        const bench = this.add.image(x, y, 'bench');

        bench.setDepth(y - 1);
    }
}
