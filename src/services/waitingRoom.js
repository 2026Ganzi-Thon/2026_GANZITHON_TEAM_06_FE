import { fetchTicket, fetchTicketStats } from './tickets.js';

export async function fetchWaitingRoomMarqueeStats ()
{
    try
    {
        const stats = await fetchTicketStats();

        return {
            arrivalCount: stats.answeredCount ?? 0,
            releasedCount: stats.letGoCount ?? 0
        };
    }
    catch
    {
        return {
            arrivalCount: null,
            releasedCount: null
        };
    }
}

export async function fetchPassedTrains (ticketId)
{
    if (!ticketId)
    {
        return null;
    }

    try
    {
        const ticket = await fetchTicket(ticketId);

        return typeof ticket.trainCount === 'number' ? ticket.trainCount : null;
    }
    catch
    {
        return null;
    }
}