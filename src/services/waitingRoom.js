import {
    msUntilNextTrain,
    readOnboardingTrip,
    saveOnboardingTrip
} from '../game/onboardingSession.js';

import { fetchTicket, fetchTicketStats } from './tickets.js';

export const WAITING_ROOM_TRAIN_CLOCK_SYNC = 'train-clock-sync';

const DEFAULT_TRAIN_SYNC_POLL_MS = 60_000;

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

function mergeTripWithTicketClock (trip, ticket)
{
    const merged = {
        ...trip,
        startedAt: ticket.startedAt ?? trip.startedAt,
        trainIntervalMs: ticket.trainIntervalMs ?? trip.trainIntervalMs,
        firstTrainAt: ticket.firstTrainAt ?? trip.firstTrainAt,
        nextTrainAt: ticket.nextTrainAt ?? trip.nextTrainAt,
        trainCount: typeof ticket.trainCount === 'number' ? ticket.trainCount : trip.trainCount
    };

    if (ticket.serverTime)
    {
        merged.clockOffsetMs = Date.parse(ticket.serverTime) - Date.now();
    }

    saveOnboardingTrip(merged);

    return merged;
}

export function getTrainSyncPollIntervalMs (trip)
{
    const interval = trip?.trainIntervalMs;

    if (typeof interval !== 'number' || interval <= 0)
    {
        return DEFAULT_TRAIN_SYNC_POLL_MS;
    }

    return Math.min(DEFAULT_TRAIN_SYNC_POLL_MS, Math.max(10_000, Math.floor(interval / 10)));
}

export async function syncWaitingRoomTicket (ticketId)
{
    if (!ticketId)
    {
        return null;
    }

    const ticket = await fetchTicket(ticketId);
    const trip = readOnboardingTrip();
    const mergedTrip = trip ? mergeTripWithTicketClock(trip, ticket) : null;

    const trainCount = typeof ticket.trainCount === 'number' ? ticket.trainCount : null;

    return {
        trainCount,
        trainIntervalMs: ticket.trainIntervalMs,
        msUntilNext: mergedTrip ? msUntilNextTrain(mergedTrip) : null
    };
}

export async function fetchPassedTrains (ticketId)
{
    try
    {
        const snapshot = await syncWaitingRoomTicket(ticketId);

        return snapshot?.trainCount ?? null;
    }
    catch
    {
        return null;
    }
}