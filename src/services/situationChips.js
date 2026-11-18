import { apiFetch } from './apiClient.js';

export async function fetchSituationChips (roomCode)
{
    const data = await apiFetch(`/api/v1/rooms/${encodeURIComponent(roomCode)}/situation-chips`);

    return data.situationChips ?? [];
}