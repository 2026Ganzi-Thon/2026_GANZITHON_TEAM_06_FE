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