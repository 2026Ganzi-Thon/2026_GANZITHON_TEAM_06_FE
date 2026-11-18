import { readGuestToken, readPendingPieces, savePendingPieces } from '../game/onboardingSession.js';

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

const END_REASONS = ['ANSWERED', 'UNEXPECTED', 'LET_GO'];

// endReasonIndex: 기다림 마치기 화면의 선택지 순서(0~2)
export async function endTicket ({ ticketId, endReasonIndex, guestToken })
{
    const piece = await apiFetch(`/api/v1/tickets/${ticketId}/end`, {
        method: 'POST',
        headers: guestToken ? { 'X-Guest-Token': guestToken } : {},
        body: JSON.stringify({ endReason: END_REASONS[endReasonIndex] })
    });

    // 비로그인 발급분은 서버가 저장하지 않으므로 나중에 옮길 수 있게 조각을 기억해 둡니다.
    if (!piece.savedToAccount)
    {
        savePendingPieces([...readPendingPieces().filter((item) => item.ticketId !== piece.ticketId), piece]);
    }

    return piece;
}

// 가입/로그인 직후 호출합니다. 보관 중인 조각이 없으면 아무것도 하지 않습니다.
export async function claimPendingTickets ()
{
    const ticketIds = readPendingPieces().map((piece) => piece.ticketId);

    if (!ticketIds.length)
    {
        return;
    }

    await apiFetch('/api/v1/tickets/claim', {
        method: 'POST',
        headers: { 'X-Guest-Token': readGuestToken() },
        body: JSON.stringify({ ticketIds })
    });

    savePendingPieces([]);
}


// 승차권 상태 (현재 도안 코드, 남은 털실 수 등). 비로그인 발급분은 게스트 토큰이 필요합니다.
export function fetchTicket (ticketId)
{
    return apiFetch(`/api/v1/tickets/${ticketId}`, { headers: guestHeaders() });
}

// 털실 1올을 쓰고 도안을 다른 걸로 바꿉니다. { patternCode, remainingYarnCount }
export function changeKnittingPattern (ticketId)
{
    return apiFetch(`/api/v1/tickets/${ticketId}/knitting/change-pattern`, {
        method: 'POST',
        headers: guestHeaders()
    });
}

// 다 뜬 털실 톡톡을 역장에게 전달했다고 기록합니다. { knittingDeliveredAt } (이미 전달했으면 처음 시각)
export function deliverKnitting (ticketId)
{
    return apiFetch(`/api/v1/tickets/${ticketId}/knitting/deliver`, {
        method: 'POST',
        headers: guestHeaders()
    });
}

function guestHeaders ()
{
    const guestToken = readGuestToken();

    return guestToken ? { 'X-Guest-Token': guestToken } : {};
}

export async function fetchTicketStats ()
{
    return apiFetch('/api/v1/tickets/stats');
}
