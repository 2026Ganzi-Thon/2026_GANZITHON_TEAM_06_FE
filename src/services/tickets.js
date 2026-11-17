import { apiFetch } from './apiClient.js';

export async function createTicket ({ roomCode, moodChip })
{
    return apiFetch('/api/v1/tickets', {
        method: 'POST',
        body: JSON.stringify({
            roomCode,
            moodChip: moodChip ?? null
        })
    });
}