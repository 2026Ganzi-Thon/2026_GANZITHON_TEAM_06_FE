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

export function readGuestToken ()
{
    return sessionStorage.getItem(GUEST_TOKEN_KEY);
}