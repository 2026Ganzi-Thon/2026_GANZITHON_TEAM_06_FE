import { apiFetch } from './apiClient.js';

export async function fetchRooms ()
{
    const data = await apiFetch('/api/v1/rooms');

    return data.rooms;
}