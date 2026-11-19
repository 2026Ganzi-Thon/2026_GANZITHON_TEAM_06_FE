export const WAITING_ROOM_REACTION_EVENT = 'waiting-room-reaction';
export const WAITING_ROOM_REACTION_REMOTE = 'waiting-room-reaction-remote';
export const WAITING_ROOM_BROADCAST_RECEIVED = 'waiting-room-broadcast-received';
export const WAITING_ROOM_BIND_LOCAL_PLAYER = 'waiting-room-bind-local-player';
// 서버가 준 접속자 목록({ passengers, mySeatNumber, myTicketNumber })을 씬에 전달한다.
export const WAITING_ROOM_PASSENGERS = 'waiting-room-passengers';

export function getReactionTexture (reactionType)
{
    if (reactionType === 'nod')
    {
        return 'reaction-nod';
    }

    if (reactionType === 'send')
    {
        return 'reaction-heart';
    }

    return null;
}