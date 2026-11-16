import { Scene } from 'phaser';

import { EventBus } from '../EventBus';

const TILE_SIZE = 32;
const ROOM_WIDTH = 1024;
const ROOM_HEIGHT = 768;
const WALL_ROWS = 2;

const ENTRANCE_WAIT_MS = 1200;
const WALK_LEG_MS = 300;
const ENTRANCE = { x: 220, y: 160 };
// 걷기 그림이 남동·남서뿐이라 곧장 위로는 가지 않고 대각선 두 번으로 간다.
const WALK_SOUTHEAST_END = { x: 520, y: 360 };
const SEAT = { x: 300, y: 500 };

const SEATED_PASSENGERS = [
    { x: 180, y: 280, direction: 'south' },
    { x: 700, y: 300, direction: 'south-east' },
    { x: 760, y: 480, direction: 'west' },
];

export class WaitingRoom extends Scene
{
    constructor ()
    {
        super('WaitingRoom');
    }

    create ()
    {
        this.createRoom();
        this.createSeatedPassengers();
        this.addBench(SEAT.x, SEAT.y);
        this.createWalkAnimations();

        this.player = this.add.sprite(ENTRANCE.x, ENTRANCE.y, 'walk-south-east-0');
        this.player.setDepth(ENTRANCE.y);

        this.time.delayedCall(ENTRANCE_WAIT_MS, () =>
        {
            if (!this.player?.active)
            {
                return;
            }

            this.walkToSeat();
        });

        EventBus.emit('current-scene-ready', this);
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
        this.player.play('walk-south-east');
        this.tweens.add({
            targets: this.player,
            x: WALK_SOUTHEAST_END.x,
            y: WALK_SOUTHEAST_END.y,
            duration: WALK_LEG_MS,
            onUpdate: () => this.player.setDepth(this.player.y),
            onComplete: () => this.walkSouthWest()
        });
    }

    walkSouthWest ()
    {
        if (!this.player?.active)
        {
            return;
        }

        this.player.play('walk-south-west');
        this.tweens.add({
            targets: this.player,
            x: SEAT.x,
            y: SEAT.y,
            duration: WALK_LEG_MS,
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
        this.player.setTexture('sit-south-west');
        this.player.setDepth(SEAT.y);
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

    createSeatedPassengers ()
    {
        SEATED_PASSENGERS.forEach((passenger) =>
        {
            this.addBench(passenger.x, passenger.y);
            const sheep = this.add.sprite(passenger.x, passenger.y - 16, `sit-${passenger.direction}`);

            sheep.setDepth(passenger.y);
        });
    }

    addBench (x, y)
    {
        const bench = this.add.image(x, y, 'bench');

        bench.setDepth(y - 1);
    }
}
