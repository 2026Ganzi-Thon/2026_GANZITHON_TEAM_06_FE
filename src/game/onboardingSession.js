export const TICKET_PLATFORM = '잠시역 3번홈';
export const TICKET_ARRIVAL = '알 수 없음';

export const ROOM_DESCRIPTIONS = {
    RESULT: '결과를 기다리는 자리',
    NO_REPLY: '답장을 기다리는 자리',
    GANZITHON_FINAL: '심사 결과를 기다리는 자리'
};

export const MOOD_CHIPS = [
    { id: 'NERVOUS', label: '조마조마한' },
    { id: 'FLUTTERING', label: '두근두근한' },
    { id: 'RESTLESS', label: '마음이 바쁜' },
    { id: 'ANXIOUS', label: '불안한' },
    { id: 'BLANK', label: '멍한' },
    { id: 'TIRED', label: '지친' },
    { id: 'CALM', label: '고요한' },
    { id: 'RELAXED', label: '느긋한' },
    { id: 'COMPOSED', label: '담담한' },
    { id: 'RELIEVED', label: '한숨 돌린' },
    { id: 'EXCITED_ANXIOUS', label: '설레고 불안한' },
    { id: 'COMPLICATED', label: '복잡한' }
];

const TRIP_KEY = 'onboardingTrip';
const GUEST_TOKEN_KEY = 'guestToken';

export function saveOnboardingTrip (trip)
{
    sessionStorage.setItem(TRIP_KEY, JSON.stringify(trip));

    if (trip.guestToken)
    {
        sessionStorage.setItem(GUEST_TOKEN_KEY, trip.guestToken);
    }
}

export function readOnboardingTrip ()
{
    const raw = sessionStorage.getItem(TRIP_KEY);

    if (!raw)
    {
        return null;
    }

    try
    {
        return JSON.parse(raw);
    }
    catch
    {
        return null;
    }
}

export function clearOnboardingTrip ()
{
    sessionStorage.removeItem(TRIP_KEY);
}

export function readGuestToken ()
{
    return sessionStorage.getItem(GUEST_TOKEN_KEY);
}

// 비로그인으로 끝낸 기다림의 조각(종료 응답). 가입/로그인 후 계정으로 옮기고, 그 전엔 임시 보관함에 보여줍니다.
const PENDING_PIECES_KEY = 'pendingPieces';

export function readPendingPieces ()
{
    try
    {
        return JSON.parse(sessionStorage.getItem(PENDING_PIECES_KEY)) || [];
    }
    catch
    {
        return [];
    }
}

export function savePendingPieces (pieces)
{
    if (pieces.length)
    {
        sessionStorage.setItem(PENDING_PIECES_KEY, JSON.stringify(pieces));
    }
    else
    {
        sessionStorage.removeItem(PENDING_PIECES_KEY);
    }
}


// 열차는 기본 30분에 한 번 지나갑니다. 서버가 간격(trainIntervalMs)을 주면 그 값을 씁니다.
const DEFAULT_TRAIN_INTERVAL_MS = 30 * 60 * 1000;

function readTrainClock (trip)
{
    if (!trip?.startedAt)
    {
        return null;
    }

    return {
        interval: trip.trainIntervalMs || DEFAULT_TRAIN_INTERVAL_MS,
        elapsed: Date.now() + (trip.clockOffsetMs || 0) - Date.parse(trip.startedAt)
    };
}

// 기다림을 시작한 뒤 지나간 열차 수 (누적). 승차권이 없으면 null.
export function countPassedTrains (trip)
{
    const clock = readTrainClock(trip);

    return clock ? Math.max(0, Math.floor(clock.elapsed / clock.interval)) : null;
}

// 다음 열차가 지나가기까지 남은 시간(ms). 승차권이 없으면 null.
// nextTrainAt이 있으면 그 시각까지(첫 열차 포함). 없으면 시작 시각과 간격으로 계산한다.
export function msUntilNextTrain (trip)
{
    if (trip?.nextTrainAt)
    {
        const nextAt = Date.parse(trip.nextTrainAt);

        if (!Number.isNaN(nextAt))
        {
            const serverNow = Date.now() + (trip.clockOffsetMs || 0);

            return Math.max(0, nextAt - serverNow);
        }
    }

    const clock = readTrainClock(trip);

    return clock ? clock.interval - (Math.max(0, clock.elapsed) % clock.interval) : null;
}
