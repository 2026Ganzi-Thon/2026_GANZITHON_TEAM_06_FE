import { Scene } from 'phaser';

const SIT_DIRECTIONS = [
    'east',
    'north',
    'north-east',
    'north-west',
    'south',
    'south-east',
    'south-west',
    'west'
];

const WALK_DIRECTIONS = ['south-east', 'south-west'];
const WALK_FRAME_COUNT = 6;

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        this.cameras.main.setBackgroundColor(0x3d2a24);
    }

    preload ()
    {
        this.load.setPath('assets');
        this.load.image('waiting-room', 'backgrounds/waiting-room/room.png');
        this.load.image('waiting-room-bench', 'items/waiting-room/bench-isometric.png');

        SIT_DIRECTIONS.forEach((direction) =>
        {
            this.load.image(`sit-${direction}`, `characters/passenger/sit/${direction}.png`);
        });

        WALK_DIRECTIONS.forEach((direction) =>
        {
            for (let frame = 0; frame < WALK_FRAME_COUNT; frame += 1)
            {
                const fileIndex = String(frame).padStart(3, '0');

                this.load.image(
                    `walk-${direction}-${frame}`,
                    `characters/passenger/walk/${direction}/frame_${fileIndex}.png`
                );
            }
        });
    }

    create ()
    {
        this.scene.start('WaitingRoom');
    }
}