import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';

import StartGame from './game/main';
import { EventBus } from './game/EventBus';

export const PhaserGame = forwardRef(function PhaserGame ({ currentActiveScene }, ref)
{
    const game = useRef();

    // DOM이 준비된 뒤에 게임을 만들어, 캔버스가 화면 밖에 생기지 않게 합니다.
    useLayoutEffect(() => {
        
        if (game.current === undefined)
        {
            game.current = StartGame("game-container");
            
            if (ref !== null)
            {
                ref.current = { game: game.current, scene: null };
            }
        }

        return () => {

            if (game.current)
            {
                game.current.destroy(true);
                game.current = undefined;
            }

        }
    }, [ref]);

    useEffect(() => {

        EventBus.on('current-scene-ready', (currentScene) => {

            if (currentActiveScene instanceof Function)
            {
                currentActiveScene(currentScene);
            }
            ref.current.scene = currentScene;
            
        });

        return () => {

            EventBus.off('current-scene-ready');

        }
        
    }, [currentActiveScene, ref])

    return (
        <div id="game-container"></div>
    );

});
