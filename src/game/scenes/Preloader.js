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
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        this.load.setPath('assets');
        this.load.image('floor', 'backgrounds/tiles/floor_tile_32.png');
        this.load.image('wall', 'backgrounds/tiles/wall_tile_32.png');
        this.load.image('bench', 'items/bench/bench_full_96x48.png');

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
