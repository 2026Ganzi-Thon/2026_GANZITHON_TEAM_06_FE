export const WAITING_ROOM_REACTION_EVENT = 'waiting-room-reaction';
export const WAITING_ROOM_REACTION_REMOTE = 'waiting-room-reaction-remote';
export const WAITING_ROOM_BROADCAST_RECEIVED = 'waiting-room-broadcast-received';
export const WAITING_ROOM_BIND_LOCAL_PLAYER = 'waiting-room-bind-local-player';

export function getReactionEmoji (reactionType)
{
    if (reactionType === 'nod')
    {
        return '👍';
    }

    if (reactionType === 'send')
    {
        return '💌';
    }

    return '✨';
}