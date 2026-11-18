import StartGame from './main';

let gameInstance = null;

export function getOrCreateGame (parentId)
{
    if (gameInstance)
    {
        return gameInstance;
    }

    gameInstance = StartGame(parentId);

    return gameInstance;
}

export function destroyGameInstance ()
{
    if (!gameInstance)
    {
        return;
    }

    gameInstance.destroy(true);
    gameInstance = null;
}