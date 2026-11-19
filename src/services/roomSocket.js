import { readGuestToken } from '../game/onboardingSession.js';

import { API_BASE_URL } from './api.js';
import { readAccessToken } from './auth.js';
import { createStompClient } from './stomp.js';

const RECONNECT_MS = 3000;

// 접속자 목록 상태: { myTicketNumber, passengers }. 서버 메시지는 { type, ... } 로 내용이 최상위에 온다.
// ROOM_STATE(전체 목록), JOIN({ passenger }), LEAVE({ ticketNumber }, 펼쳐서 옴), BROADCAST(발신 승객의 호칭·상태 갱신)를 반영한다.
export function applyRoomEvent (state, message)
{
    if (message.type === 'ROOM_STATE')
    {
        return { myTicketNumber: message.myTicketNumber, passengers: message.passengers ?? [] };
    }

    if (message.type === 'JOIN')
    {
        const others = state.passengers.filter((item) => item.ticketNumber !== message.passenger.ticketNumber);

        return { ...state, passengers: [...others, message.passenger] };
    }

    if (message.type === 'LEAVE')
    {
        return { ...state, passengers: state.passengers.filter((item) => item.ticketNumber !== message.ticketNumber) };
    }

    if (message.type === 'BROADCAST')
    {
        return {
            ...state,
            passengers: state.passengers.map((item) => (item.ticketNumber === message.ticketNumber
                ? { ...item, displayName: message.displayName, moodChip: message.moodChip }
                : item))
        };
    }

    return state;
}

// 대기실 소켓에 연결해 입장합니다.
// onState(state): 접속자 목록이 바뀔 때, onEvent(message): BROADCAST·REACTION·ERROR 등 화면이 따로 처리할 메시지, onFatal(): 토큰 거부로 연결이 막혔을 때.
// 반환: { disconnect, sendBroadcast, sendReaction }
export function connectWaitingRoom ({ roomCode, ticketId, onState, onEvent, onFatal })
{
    const accessToken = readAccessToken();
    const guestToken = readGuestToken();
    // 어느 토큰으로 티켓 소유가 인정되는지 서버가 확정하지 못해서 가진 토큰을 모두 보낸다.
    const headers = {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...(guestToken && { 'X-Guest-Token': guestToken })
    };
    let state = { myTicketNumber: null, passengers: [] };
    let reconnectTimer = null;
    let stopped = false;

    const handleEvent = (frame) =>
    {
        let message;

        try
        {
            message = JSON.parse(frame.body);
        }
        catch
        {
            return; // 읽을 수 없는 이벤트는 무시한다
        }

        const next = applyRoomEvent(state, message);

        if (next !== state)
        {
            state = next;
            onState(state);
        }

        onEvent?.(message);
    };

    const client = createStompClient({
        url: `${API_BASE_URL.replace(/^http/, 'ws')}/ws`,
        headers,
        onConnect: () =>
        {
            // 입장 실패(ERROR)가 /user/queue/events로 오므로 join보다 먼저 구독한다.
            client.subscribe('/user/queue/events', handleEvent);
            client.subscribe(`/topic/rooms/${roomCode}`, handleEvent);
            client.publish(`/app/rooms/${roomCode}/join`, { ticketId });
        },
        onError: () =>
        {
            stopped = true;
            onFatal?.();
        },
        onClose: () =>
        {
            if (!stopped)
            {
                reconnectTimer = setTimeout(client.connect, RECONNECT_MS);
            }
        }
    });

    client.connect();

    return {
        disconnect: () =>
        {
            stopped = true;
            clearTimeout(reconnectTimer);
            client.disconnect();
        },
        sendBroadcast: ({ situationChipCode, moodChip }) => client.publish(`/app/rooms/${roomCode}/broadcast`, { situationChipCode, moodChip }),
        sendReaction: ({ broadcastId, reaction }) => client.publish(`/app/rooms/${roomCode}/reaction`, { broadcastId, reaction })
    };
}
