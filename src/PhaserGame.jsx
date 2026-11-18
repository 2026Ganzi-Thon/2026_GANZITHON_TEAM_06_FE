import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';

import { destroyGameInstance, getOrCreateGame } from './game/gameInstance';
import { EventBus } from './game/EventBus';

export const PhaserGame = forwardRef(function PhaserGame ({ currentActiveScene }, ref)
{
    const game = useRef();

    useLayoutEffect(() =>
    {
        if (game.current === undefined)
        {
            game.current = getOrCreateGame('game-container');

            if (ref !== null)
            {
                ref.current = { game: game.current, scene: null };
            }
        }

        return () =>
        {
            destroyGameInstance();
            game.current = undefined;
        };
    }, [ref]);

    useEffect(() =>
    {
        const handleSceneReady = (currentScene) =>
        {
            if (currentActiveScene instanceof Function)
            {
                currentActiveScene(currentScene);
            }

            if (ref?.current)
            {
                ref.current.scene = currentScene;
            }
        };

        EventBus.on('current-scene-ready', handleSceneReady);

        return () =>
        {
            EventBus.off('current-scene-ready', handleSceneReady);
        };
    }, [currentActiveScene, ref]);

    useEffect(() =>
    {
        const container = document.getElementById('game-container');
        const instance = game.current;

        if (!container || !instance)
        {
            return;
        }

        const resize = () =>
        {
            const width = container.clientWidth;
            const height = container.clientHeight;

            if (width > 0 && height > 0)
            {
                instance.scale.resize(width, height);
            }
        };

        resize();

        const observer = new ResizeObserver(resize);
        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    return (
        <div id="game-container" />
    );
});