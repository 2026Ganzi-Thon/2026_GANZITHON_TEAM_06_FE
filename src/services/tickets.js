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

export async function fetchTicket (ticketId)
{
    return apiFetch(`/api/v1/tickets/${encodeURIComponent(ticketId)}`);
}

export async function fetchTicketStats ()
{
    return apiFetch('/api/v1/tickets/stats');
}