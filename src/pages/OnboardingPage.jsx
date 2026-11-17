import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppHeader from '../components/common/AppHeader';
import MongsilDialogue from '../components/onboarding/MongsilDialogue';
import {
    MOOD_CHIPS,
    ROOM_DESCRIPTIONS,
    saveOnboardingTrip
} from '../game/onboardingSession';
import { requestWaitingRoomEntrance } from '../game/waitingRoomEntry';
import { fetchRooms } from '../services/rooms';
import { createTicket } from '../services/tickets';

const STEP_START = 'start';
const STEP_GREETING = 'greeting';
const STEP_ROOM = 'room';
const STEP_STATUS = 'status';
const STEP_TICKET = 'ticket';

function NextButton ({ disabled, onClick })
{
    return (
        <button type="button" className="onboarding-next" disabled={disabled} onClick={onClick} aria-label="다음">
            <img src="/assets/ui/next-button.png" alt="" />
        </button>
    );
}

function SpeakerIcon ()
{
    return (
        <svg className="onboarding-speaker" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
            <path d="M16.5 9.5a4 4 0 010 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export default function OnboardingPage ()
{
    const navigate = useNavigate();
    // TODO: 마이 양에 다녀오면 단계·방·칩이 초기화된다. 필요해지면 sessionStorage에 남겨 그 화면으로 복원한다.
    const [step, setStep] = useState(STEP_START);
    const [roomCode, setRoomCode] = useState(null);
    const [moodChip, setMoodChip] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomsError, setRoomsError] = useState(null);
    const [ticketLoading, setTicketLoading] = useState(false);
    const [ticketError, setTicketError] = useState(null);
    const [issuedTicketNumber, setIssuedTicketNumber] = useState(null);

    const selectedRoom = rooms.find((room) => room.roomCode === roomCode);

    const loadRooms = async () =>
    {
        setRoomsLoading(true);
        setRoomsError(null);

        try
        {
            const nextRooms = await fetchRooms();
            setRooms(nextRooms);
        }
        catch (error)
        {
            setRoomsError(error.message);
        }
        finally
        {
            setRoomsLoading(false);
        }
    };

    useEffect(() =>
    {
        if (step === STEP_ROOM && rooms.length === 0 && !roomsLoading && !roomsError)
        {
            loadRooms();
        }
    }, [step, rooms.length, roomsLoading, roomsError]);

    const handleSkipStatus = () =>
    {
        setMoodChip(null);
        setIssuedTicketNumber(null);
        setTicketError(null);
        setStep(STEP_TICKET);
    };

    const handleReceiveTicket = async () =>
    {
        if (!roomCode)
        {
            return;
        }

        setTicketLoading(true);
        setTicketError(null);

        try
        {
            const ticket = await createTicket({
                roomCode,
                moodChip: moodChip ?? null
            });

            setIssuedTicketNumber(ticket.ticketNumber);
            saveOnboardingTrip({
                roomCode,
                moodChip: ticket.moodChip,
                ticketId: ticket.ticketId,
                ticketNumber: ticket.ticketNumber,
                displayName: ticket.displayName,
                patternCode: ticket.patternCode,
                guestToken: ticket.guestToken
            });
            requestWaitingRoomEntrance();
            navigate('/waiting-room');
        }
        catch (error)
        {
            setTicketError(error.message);
        }
        finally
        {
            setTicketLoading(false);
        }
    };

    return (
        <main className={`onboarding onboarding-${step}`}>
            <AppHeader showMySheep={step !== STEP_START} />

            {step === STEP_START && (
                <section className="onboarding-start">
                    <img className="onboarding-title" src="/assets/ui/title.png" alt="잠시 정차합니다." />
                    <img className="onboarding-subtitle" src="/assets/ui/subtitle.png" alt="기다리는 동안, 잠시 쉬어 가세요." />
                    <button type="button" className="onboarding-pill" onClick={() => setStep(STEP_GREETING)}>
                        <span className="onboarding-play" aria-hidden="true" />
                        대합실 들어가기
                    </button>
                </section>
            )}

            {step === STEP_GREETING && (
                <>
                    <p className="onboarding-broadcast">
                        <SpeakerIcon />
                        잠시 정차합니다. 서두르지 않아도 괜찮습니다.
                    </p>
                    <MongsilDialogue actions={<NextButton onClick={() => setStep(STEP_ROOM)} />}>
                        <p>어서 오세요.</p>
                        <p>오늘은 어떤 기다림을 안고 오셨어요?</p>
                    </MongsilDialogue>
                </>
            )}

            {step === STEP_ROOM && (
                <>
                    {roomsLoading && <p className="onboarding-status">대기실 목록을 불러오는 중이에요.</p>}
                    {roomsError && (
                        <div className="onboarding-status">
                            <p className="onboarding-error">{roomsError}</p>
                            <button type="button" className="onboarding-skip" onClick={loadRooms}>다시 시도</button>
                        </div>
                    )}
                    {!roomsLoading && !roomsError && (
                        <ul className="onboarding-choices">
                            {rooms.map((room, index) => (
                                <li key={room.roomCode}>
                                    <button
                                        type="button"
                                        className={room.roomCode === roomCode ? 'onboarding-choice is-selected' : 'onboarding-choice'}
                                        aria-pressed={room.roomCode === roomCode}
                                        onClick={() => setRoomCode(room.roomCode)}
                                    >
                                        <span className="onboarding-choice-index">{index + 1}</span>
                                        <span className="onboarding-choice-copy">
                                            <strong>{room.name}</strong>
                                            <span>{ROOM_DESCRIPTIONS[room.roomCode] ?? ''}</span>
                                        </span>
                                        {room.roomCode === roomCode && <span className="onboarding-check" aria-hidden="true">✓</span>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <MongsilDialogue
                        actions={<NextButton disabled={!roomCode} onClick={() => setStep(STEP_STATUS)} />}
                    >
                        <p>어떤 기다림이든 앉을 자리가 있어요.</p>
                        <p>편한 문으로 들어가 보세요.</p>
                    </MongsilDialogue>
                </>
            )}

            {step === STEP_STATUS && (
                <>
                    <ul className="onboarding-chips">
                        {MOOD_CHIPS.map((chip) => (
                            <li key={chip.id}>
                                <button
                                    type="button"
                                    className={chip.id === moodChip ? 'onboarding-chip is-selected' : 'onboarding-chip'}
                                    aria-pressed={chip.id === moodChip}
                                    onClick={() => setMoodChip(chip.id)}
                                >
                                    {chip.label}
                                    {chip.id === moodChip && <span className="onboarding-check" aria-hidden="true">✓</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <MongsilDialogue
                        actions={(
                            <>
                                <NextButton
                                    disabled={!moodChip}
                                    onClick={() =>
                                    {
                                        setIssuedTicketNumber(null);
                                        setTicketError(null);
                                        setStep(STEP_TICKET);
                                    }}
                                />
                                <button type="button" className="onboarding-skip" onClick={handleSkipStatus}>
                                    건너뛰기 &gt;&gt;
                                </button>
                            </>
                        )}
                    >
                        <p>지금 마음은 어떤 모양이에요?</p>
                        <p>고르기 어려우면 건너뛰어도 괜찮아요.</p>
                    </MongsilDialogue>
                </>
            )}

            {step === STEP_TICKET && selectedRoom && (
                <section className="ticket-step">
                    <img className="ticket-sparkle" src="/assets/ui/ticket-sparkle.png" alt="" />
                    <p className="ticket-caption">대합실로 가는 승차권이에요.</p>
                    <article className="ticket">
                        <img src="/assets/ui/ticket.png" alt="승차권. 출발역 잠시역 3번홈, 도착예정 알 수 없음" />
                        <p className="ticket-destination">{selectedRoom.name}</p>
                        <p className="ticket-number">
                            NO. {issuedTicketNumber ?? '—'}
                        </p>
                    </article>
                    {ticketError && <p className="onboarding-error">{ticketError}</p>}
                    <button
                        type="button"
                        className="onboarding-pill"
                        disabled={ticketLoading}
                        onClick={handleReceiveTicket}
                    >
                        <img className="ticket-pill-icon" src="/assets/ui/ticket-sparkle.png" alt="" />
                        {ticketLoading ? '발급 중…' : '승차권 받기'}
                    </button>
                </section>
            )}
        </main>
    );
}