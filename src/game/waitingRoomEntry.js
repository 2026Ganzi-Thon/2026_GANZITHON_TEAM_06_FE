const WAITING_ROOM_ENTERED_KEY = 'waitingRoomEntered';
const ENTRANCE_PENDING_KEY = 'waitingRoomEntrancePending';

export function hasEnteredWaitingRoom ()
{
    return sessionStorage.getItem(WAITING_ROOM_ENTERED_KEY) === 'true';
}

export function requestWaitingRoomEntrance ()
{
    sessionStorage.setItem(ENTRANCE_PENDING_KEY, 'true');
}

export function shouldPlayWaitingRoomEntrance ()
{
    return sessionStorage.getItem(ENTRANCE_PENDING_KEY) === 'true';
}

export function markWaitingRoomEntered ()
{
    sessionStorage.removeItem(ENTRANCE_PENDING_KEY);
    sessionStorage.setItem(WAITING_ROOM_ENTERED_KEY, 'true');
}
