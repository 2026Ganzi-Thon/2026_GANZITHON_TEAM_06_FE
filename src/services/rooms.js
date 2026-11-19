import { apiFetch } from './apiClient.js';

export async function fetchRooms ()
{
    const data = await apiFetch('/api/v1/rooms');

    return data.rooms;
}

// 방별 현재 인원: [{ roomCode, count, seatedCount, standingCount, seatCount }].
// 토큰이 필요 없는 API라, 5초마다 부르다 만료 토큰 때문에 로그아웃되지 않게 토큰을 보내지 않는다.
export async function fetchRoomOccupancy ()
{
    const data = await apiFetch('/api/v1/rooms/occupancy', { withAuth: false });

    return data.rooms;
}
