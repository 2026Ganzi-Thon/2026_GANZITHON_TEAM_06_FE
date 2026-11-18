import { apiFetch } from './apiClient.js';
import { fetchRooms } from './rooms.js';

const EMPTY_STATS = {
    waitingCount: 0,
    arrivalCount: 0,
    releasedCount: 0,
    passedTrains: 0
};

export async function fetchRoomStats (roomCode)
{
    try
    {
        const stats = await apiFetch(`/api/v1/rooms/${encodeURIComponent(roomCode)}/stats`);

        return {
            waitingCount: stats.waitingCount ?? 0,
            arrivalCount: stats.arrivalCount ?? 0,
            releasedCount: stats.releasedCount ?? 0,
            passedTrains: stats.passedTrains ?? 0
        };
    }
    catch
    {
        // stats API 미연동 시 rooms 목록에서 같은 roomCode 찾기
    }

    try
    {
        const rooms = await fetchRooms();
        const room = rooms.find((item) => item.roomCode === roomCode);

        if (room)
        {
            return {
                waitingCount: room.waitingCount ?? 0,
                arrivalCount: room.arrivalCount ?? 0,
                releasedCount: room.releasedCount ?? 0,
                passedTrains: room.passedTrains ?? 0
            };
        }
    }
    catch
    {
        // 연결 불가
    }

    return { ...EMPTY_STATS };
}