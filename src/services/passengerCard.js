import { PATTERN_IMAGE_NAMES } from '../data/pieces.js';

const MOCK_DELAY_MS = 300;

// 대기실에서 탭한 승객의 카드(서버 PASSENGER_CARD와 같은 필드)를 받아 옵니다.
// shortcut: 웹소켓 연결(#39) 전까지 가짜 응답을 돌려준다. 병합되면 /app/rooms/{roomCode}/passenger-card 요청으로 바꾼다, #47
export async function requestPassengerCard (roomCode, ticketNumber)
{
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

    const isPublic = ticketNumber % 2 === 0;

    return {
        ticketNumber,
        displayName: `${ticketNumber}번 두근두근한 양`,
        moodChip: 'FLUTTERING',
        startedTs: Date.now() - (80 + (ticketNumber % 7) * 13) * 60_000,
        visibility: isPublic ? 'PUBLIC' : 'PRIVATE',
        patternCodes: isPublic ? Object.keys(PATTERN_IMAGE_NAMES).slice(0, 3 + (ticketNumber % 7)) : [],
        trainCount: isPublic ? ticketNumber % 20 : null,
        serverTs: Date.now()
    };
}
