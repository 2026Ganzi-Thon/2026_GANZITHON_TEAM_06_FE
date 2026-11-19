import { Scene } from 'phaser';

const WALK_FRAME_COUNT = 3;

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
        this.load.image('bench-vine', 'items/waiting-room/bench-vine.png');
        this.load.image('bench-plain', 'items/waiting-room/bench-plain.png');
        this.load.svg('train', 'ui/waiting-room/train.svg', { width: 1238, height: 579 });
        for (let frame = 0; frame < 12; frame += 1)
        {
            // 작은 SVG라 3배로 래스터화해서 확대해도 덜 흐리게 한다.
            this.load.svg(`steam-${frame}`, `ui/waiting-room/steam_${String(frame).padStart(2, '0')}.svg`, { scale: 3 });
        }

        this.load.audio('train-sound', 'sounds/train.mp3');
        this.load.svg('wool01', 'ui/waiting-room/wool01.svg', { scale: 3 });
        this.load.svg('wool02', 'ui/waiting-room/wool02.svg', { scale: 3 });
        this.load.svg('wool03', 'ui/waiting-room/wool03.svg', { scale: 3 });
        this.load.svg('window', 'ui/waiting-room/window.svg', { width: 1450, height: 725 });
        this.load.image('me-chip', 'ui/waiting-room/me-chip.png');
        this.load.image('reaction-nod', 'ui/waiting-room/reaction-nod.png');
        this.load.image('reaction-heart', 'ui/waiting-room/reaction-heart.png');

        this.load.image('passenger', 'characters/passenger/sit/passenger.png');
        this.load.image('station-master', 'characters/station-master/waiting-room.png');

        for (let frame = 0; frame < WALK_FRAME_COUNT; frame += 1)
        {
            const fileIndex = String(frame).padStart(3, '0');

            this.load.image(`walk-south-west-${frame}`, `characters/passenger/walk/frame_${fileIndex}.png`);
        }

        // 앉기 직전 한 프레임은 새 걷기 첫 장을 그대로 쓴다.
        this.load.image('walk-south-east-0', 'characters/passenger/walk/frame_000.png');
    }

    create ()
    {
        this.scene.start('WaitingRoom');
    }
}