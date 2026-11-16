import { AUTO, Game } from 'phaser';

import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { WaitingRoom } from './scenes/WaitingRoom';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        WaitingRoom
    ]
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;
