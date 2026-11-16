import { Scene } from 'phaser';

import { EventBus } from '../EventBus';

const TILE_SIZE = 32;
const ROOM_WIDTH = 1024;
const ROOM_HEIGHT = 768;
const WALL_ROWS = 2;

const ENTRANCE = { x: 220, y: 160 };

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

        this.player = this.add.sprite(ENTRANCE.x, ENTRANCE.y, 'walk-south-east-0');
        this.player.setDepth(ENTRANCE.y);

        EventBus.emit('current-scene-ready', this);
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
