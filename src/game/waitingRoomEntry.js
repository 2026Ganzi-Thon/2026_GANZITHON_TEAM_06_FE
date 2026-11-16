const WAITING_ROOM_ENTERED_KEY = 'waitingRoomEntered';

export function hasEnteredWaitingRoom ()
{
    return sessionStorage.getItem(WAITING_ROOM_ENTERED_KEY) === 'true';
}

export function markWaitingRoomEntered ()
{
    sessionStorage.setItem(WAITING_ROOM_ENTERED_KEY, 'true');
}
