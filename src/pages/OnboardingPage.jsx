import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import AppHeader from '../components/common/AppHeader';
import ChatPanel from '../components/common/ChatPanel';
import ChoiceButton from '../components/common/ChoiceButton';
import {
    MOOD_CHIPS,
    ROOM_DESCRIPTIONS,
    readOnboardingTrip,
    saveOnboardingTrip
} from '../game/onboardingSession';
import { requestWaitingRoomEntrance } from '../game/waitingRoomEntry';
import { fetchRoomOccupancy, fetchRooms } from '../services/rooms';
import { createTicket, updateTicketMoodChip } from '../services/tickets';
import { useBackgroundMusic } from '../utils/useBackgroundMusic';

const STEP_START = 'start';
const STEP_GREETING = 'greeting';
const STEP_ROOM = 'room';
const STEP_STATUS = 'status';
const STEP_TICKET = 'ticket';
// 승차권이 발급되는 연출을 보여 준 뒤 대기실로 넘어가기까지의 시간(ms)
const ISSUE_ANIMATION_MS = 2200;
// 방 선택 화면에 있는 동안 방별 인원을 다시 불러오는 간격(ms). 서버가 밀어 주지 않아 직접 다시 조회한다.
const OCCUPANCY_POLL_MS = 5000;

// 방 버튼에 붙일 인원 글자. 서 있는 승객이 있을 때만 입석 수를 덧붙인다.
function formatOccupancy (occupancy)
{
    if (!occupancy)
    {
        return null;
    }

    const waiting = `${occupancy.count}명 대기`;

    return occupancy.standingCount > 0 ? `${waiting} · 입석 ${occupancy.standingCount}명` : waiting;
}

export default function OnboardingPage ()
{
    const navigate = useNavigate();
    const location = useLocation();
    // TODO: 마이 양에 다녀오면 단계·방·칩이 초기화된다. 필요해지면 sessionStorage에 남겨 그 화면으로 복원한다.
    // 담요 저장 후 '새 승차권 받기'로 오면 대기실 선택 단계부터 시작한다.
    const [step, setStep] = useState(location.state?.startStep === STEP_ROOM ? STEP_ROOM : STEP_START);
    const [roomCode, setRoomCode] = useState(null);
    const [moodChip, setMoodChip] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomsError, setRoomsError] = useState(null);
    // 방 코드별 현재 인원. 불러오기 전이나 실패하면 비어 있어 인원 배지를 그리지 않는다.
    const [occupancyByRoom, setOccupancyByRoom] = useState({});
    const [ticketLoading, setTicketLoading] = useState(false);
    const [ticketError, setTicketError] = useState(null);
    const [issuedTicketNumber, setIssuedTicketNumber] = useState(null);
    // 발급이 끝나 연출을 보여 주는 중인지
    const [isIssued, setIsIssued] = useState(false);

    useEffect(() =>
    {
        if (!isIssued)
        {
            return undefined;
        }

        const timer = setTimeout(() => navigate('/waiting-room'), ISSUE_ANIMATION_MS);

        return () => clearTimeout(timer);
    }, [isIssued, navigate]);

    useBackgroundMusic('/assets/sounds/onboarding.mp3', 0.3);

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

    // 방 선택 단계에 있는 동안만 방별 인원을 주기적으로 불러온다. 실패하면 마지막으로 받은 인원을 그대로 둔다.
    useEffect(() =>
    {
        if (step !== STEP_ROOM)
        {
            return undefined;
        }

        let cancelled = false;

        const loadOccupancy = async () =>
        {
            try
            {
                const list = await fetchRoomOccupancy();

                if (!cancelled)
                {
                    setOccupancyByRoom(Object.fromEntries(list.map((item) => [item.roomCode, item])));
                }
            }
            catch
            {
                // 인원은 보조 정보라 실패해도 방 선택은 그대로 할 수 있게 둔다.
            }
        };

        loadOccupancy();
        const intervalId = setInterval(loadOccupancy, OCCUPANCY_POLL_MS);

        return () =>
        {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [step]);

    // 승차권 화면에 들어오면 바로 벨 소리를 낸다. 자동재생 차단 등으로 실패해도 무시한다.
    useEffect(() =>
    {
        if (step === STEP_TICKET)
        {
            const bell = new Audio('/assets/sounds/bell.mp3');

            bell.volume = 0.6;
            bell.play().catch(() => {});
        }
    }, [step]);

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

        // 승차권 받기를 누르면 승차권 소리를 낸다. 자동재생 차단 등으로 실패해도 무시한다.
        new Audio('/assets/sounds/ticket.mp3').play().catch(() => {});

        setTicketLoading(true);
        setTicketError(null);

        try
        {
            const existingTrip = readOnboardingTrip();
            const sameRoomTicket = existingTrip?.ticketId && existingTrip.roomCode === roomCode;
            let ticket = null;

            if (sameRoomTicket)
            {
                try
                {
                    ticket = await updateTicketMoodChip(existingTrip.ticketId, moodChip ?? null);
                }
                catch (error)
                {
                    // 보관 중인 승차권을 수정할 권한이 없으면(로그인 필요 등) 새로 발급합니다.
                    if (error.code !== 'AUTH_LOGIN_REQUIRED')
                    {
                        throw error;
                    }
                }
            }

            ticket ??= await createTicket({
                roomCode,
                moodChip: moodChip ?? null
            });

            setIssuedTicketNumber(ticket.ticketNumber ?? existingTrip?.ticketNumber);
            saveOnboardingTrip({
                ...existingTrip,
                roomCode,
                roomName: selectedRoom?.name,
                moodChip: ticket.moodChip,
                ticketId: ticket.ticketId ?? existingTrip?.ticketId,
                ticketNumber: ticket.ticketNumber ?? existingTrip?.ticketNumber,
                displayName: ticket.displayName,
                patternCode: ticket.patternCode ?? existingTrip?.patternCode,
                guestToken: ticket.guestToken ?? existingTrip?.guestToken,
                // 열차 시각 계산용: 시작 시각, 열차 간격, 기기 시계와 서버 시계의 차이
                startedAt: ticket.startedAt ?? existingTrip?.startedAt,
                trainIntervalMs: ticket.trainIntervalMs ?? existingTrip?.trainIntervalMs,
                firstTrainAt: ticket.firstTrainAt ?? existingTrip?.firstTrainAt,
                nextTrainAt: ticket.nextTrainAt ?? existingTrip?.nextTrainAt,
                trainCount: typeof ticket.trainCount === 'number' ? ticket.trainCount : existingTrip?.trainCount,
                clockOffsetMs: ticket.serverTime
                    ? Date.parse(ticket.serverTime) - Date.now()
                    : existingTrip?.clockOffsetMs
            });
            requestWaitingRoomEntrance();
            setIsIssued(true);
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

    // 대화창에 보여 줄 내용. 승차권 단계는 사라지는 동안 상태 선택 단계의 내용을 그대로 쓴다.
    const chatSteps = {
        [STEP_GREETING]: {
            portrait: 'portrait01',
            message: '어서 오세요.\n오늘은 어떤 기다림을 안고 오셨어요?',
            onNext: () => setStep(STEP_ROOM)
        },
        [STEP_ROOM]: {
            portrait: 'portrait01',
            message: '어떤 기다림이든 앉을 자리가 있어요.\n편한 문으로 들어가 보세요.',
            nextDisabled: !roomCode,
            onNext: () => setStep(STEP_STATUS)
        },
        [STEP_STATUS]: {
            portrait: 'portrait05',
            message: '지금 마음은 어떤 모양이에요?\n고르기 어려우면 건너뛰어도 괜찮아요.',
            nextDisabled: !moodChip,
            onNext: () =>
            {
                setIssuedTicketNumber(null);
                setTicketError(null);
                setStep(STEP_TICKET);
            },
            extra: (
                <button type="button" className="finish-waiting-extra-btn" onClick={handleSkipStatus}>
                    건너뛰기 &gt;&gt;
                </button>
            )
        }
    };
    const chatContent = chatSteps[step === STEP_TICKET ? STEP_STATUS : step] ?? {};

    return (
        <main className={`onboarding onboarding-${step}`}>
            <AppHeader collapseOnDrag showMySheep={step !== STEP_START} />

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
                        <img className="onboarding-speaker" src="/assets/backgrounds/onboarding/icon-announce.svg" alt="" />
                        잠시 정차합니다. 서두르지 않아도 괜찮습니다.
                    </p>
                </>
            )}

            {step === STEP_ROOM && (
                <>
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
                                    <ChoiceButton
                                        index={index + 1}
                                        title={room.name}
                                        subtitle={ROOM_DESCRIPTIONS[room.roomCode] ?? ''}
                                        badge={formatOccupancy(occupancyByRoom[room.roomCode])}
                                        selected={room.roomCode === roomCode}
                                        onClick={() => setRoomCode(room.roomCode)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
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
                                    {chip.id === moodChip && (
                                        <span className="finish-waiting-check">
                                            <img src="/assets/finish-waiting/check.png" alt="선택됨" />
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {/* 몽실 역장 대화창은 인사~상태 선택 단계 내내 한 번만 올라오고, 승차권 단계로 넘어갈 때 내려간다 (단계마다 다시 나타나지 않는다) */}
            {step !== STEP_START && (
                <div className="onboarding-chat">
                    <ChatPanel
                        portrait={chatContent.portrait}
                        message={chatContent.message}
                        nextDisabled={chatContent.nextDisabled}
                        onNext={chatContent.onNext}
                        closing={step === STEP_TICKET}
                        typing
                    >
                        {chatContent.extra}
                    </ChatPanel>
                </div>
            )}

            {step === STEP_TICKET && selectedRoom && (
                <section className={isIssued ? 'ticket-step is-issued' : 'ticket-step'}>
                    <div className="ticket-step-top">
                        <img className="ticket-sparkle" src="/assets/ui/ticket-sparkle.png" alt="" />
                        <p className="ticket-caption">대합실로 가는 승차권이에요.</p>
                    </div>
                    <article className={isIssued ? 'ticket is-issued' : 'ticket'}>
                        <img src="/assets/ui/ticket.png" alt="승차권. 출발역 잠시역 3번홈, 도착예정 알 수 없음" />
                        <p className="ticket-destination">{selectedRoom.name}</p>
                        <p className="ticket-number">
                            <span className="ticket-number-label">NO</span>
                            {issuedTicketNumber != null && (
                                <span className="ticket-number-value">. {issuedTicketNumber}</span>
                            )}
                        </p>
                    </article>
                    <div className="ticket-step-bottom">
                        {ticketError && <p className="onboarding-error">{ticketError}</p>}
                        <button
                            type="button"
                            className="onboarding-pill ticket-pill"
                            disabled={ticketLoading || isIssued}
                            onClick={handleReceiveTicket}
                        >
                            <img className="ticket-pill-icon" src="/assets/backgrounds/onboarding/icon-ticket.svg" alt="" />
                            {ticketLoading ? '발급 중…' : isIssued ? '발급 완료' : '승차권 받기'}
                        </button>
                    </div>
                </section>
            )}
        </main>
    );
}