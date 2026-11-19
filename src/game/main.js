import { AUTO, Game, Scale } from 'phaser';

import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { WaitingRoom } from './scenes/WaitingRoom';

const config = {
    type: AUTO,
    width: 1442,
    height: 841,
    parent: 'game-container',
    backgroundColor: '#000000',
    // 큰 이미지(벤치 1024px, 양 400px)를 작게 줄여 그릴 때 계단처럼 깨지지 않게 밉맵을 쓴다.
    render: {
        mipmapFilter: 'LINEAR_MIPMAP_LINEAR'
    },
    scale: {
        mode: Scale.RESIZE,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        WaitingRoom
    ]
};

const StartGame = (parent) => new Game({ ...config, parent });

export default StartGame;