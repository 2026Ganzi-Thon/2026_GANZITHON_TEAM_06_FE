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
        this.load.image('clock', 'backgrounds/waiting-room/clock.png');
        this.load.image('waiting-room-bench', 'items/waiting-room/bench-isometric.png');
        this.load.svg('train', 'ui/waiting-room/train.svg', { width: 1238, height: 579 });
        for (let frame = 0; frame < 12; frame += 1)
        {
            // 작은 SVG라 3배로 래스터화해서 확대해도 덜 흐리게 한다.
            this.load.svg(`steam-${frame}`, `ui/waiting-room/steam_${String(frame).padStart(2, '0')}.svg`, { scale: 3 });
        }

        this.load.svg('wool01', 'ui/waiting-room/wool01.svg', { scale: 3 });
        this.load.svg('wool02', 'ui/waiting-room/wool02.svg', { scale: 3 });
        this.load.svg('wool03', 'ui/waiting-room/wool03.svg', { scale: 3 });
        this.load.svg('window', 'ui/waiting-room/window.svg', { width: 1450, height: 725 });

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