import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppHeader from '../components/common/AppHeader';
import ChatPanel from '../components/common/ChatPanel';
import PassengerCard from '../components/waitingRoom/PassengerCard';
import WaitingRoomActionBar from '../components/waitingRoom/WaitingRoomActionBar';
import WaitingRoomBroadcastModal from '../components/waitingRoom/WaitingRoomBroadcastModal';
import WaitingRoomMarquee from '../components/waitingRoom/WaitingRoomMarquee';
import WaitingRoomReactionBubble from '../components/waitingRoom/WaitingRoomReactionBubble';
import WaitingRoomTopBar from '../components/waitingRoom/WaitingRoomTopBar';
import WaitingRoomWoolLabel from '../components/waitingRoom/WaitingRoomWoolLabel';
import WoolTokPanel from '../components/waitingRoom/woolTok/WoolTokPanel';
import { BROADCAST_COOLDOWN_MS, BROADCAST_DURATION_MS } from '../data/waitingRoomBroadcast';
import { PhaserGame } from '../PhaserGame';
import { EventBus } from '../game/EventBus';
import { countPassedTrains, readOnboardingTrip, ROOM_DESCRIPTIONS } from '../game/onboardingSession';
import {
    WAITING_ROOM_BIND_LOCAL_PLAYER,
    WAITING_ROOM_BROADCAST_RECEIVED,
    WAITING_ROOM_PASSENGERS,
    WAITING_ROOM_REACTION_EVENT,
    WAITING_ROOM_REACTION_REMOTE
} from '../game/waitingRoomReactionEvents';
import { connectWaitingRoom } from '../services/roomSocket';
import {
    fetchWaitingRoomMarqueeStats,
    getTrainSyncPollIntervalMs,
    syncWaitingRoomTicket,
    WAITING_ROOM_TRAIN_CLOCK_SYNC
} from '../services/waitingRoom';
import { useBackgroundMusic } from '../utils/useBackgroundMusic';

// 헤더가 숨고/다시 나타나는 스크롤 거리(px). 깜빡임을 막으려고 두 값을 다르게 둔다.
const HEADER_HIDE_PAN = 20;
const HEADER_SHOW_PAN = 4;
// 열차 안내 패널이 떠 있는 시간(ms)
const TRAIN_CHAT_MS = 6000;
// 안내 패널이 내려가며 사라지는 시간(ms). finish-waiting.css의 chat-panel-fall 길이와 같게 둔다.
const CHAT_EXIT_MS = 350;
const TRAIN_COUNT_SYNC_AFTER_PASS_MS = 1500;
// 화면의 리액션 이름과 서버 값. 서버(배포본) 값은 NOD(끄덕끄덕) / SEND(전해요)다.
const REACTION_TO_SERVER = { nod: 'NOD', send: 'SEND' };
const SERVER_TO_REACTION = { NOD: 'nod', SEND: 'send' };

export default function WaitingRoomPage ()
{
    const navigate = useNavigate();
    useBackgroundMusic('/assets/sounds/onboarding.mp3', 0.3);
    const trip = useMemo(() => readOnboardingTrip(), []);
    const [marqueeStats, setMarqueeStats] = useState({
        arrivalCount: null,
        releasedCount: null
    });
    const [statsLoading, setStatsLoading] = useState(Boolean(trip?.roomCode));
    const [broadcastPhase, setBroadcastPhase] = useState('idle');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    // 다음 방송을 쓸 수 있게 되는 시각(ms). 버튼의 남은 초 표시와 새로고침 복원에 쓴다.
    const [cooldownEndsAt, setCooldownEndsAt] = useState(null);
    const [now, setNow] = useState(() => Date.now());
    const cooldownStorageKey = `waitingRoomBroadcastEndsAt:${trip?.roomCode ?? ''}`;
    const [reactionVisible, setReactionVisible] = useState(false);
    const [stationMasterAnchor, setStationMasterAnchor] = useState(null);
    const [reactionBroadcasterTicketNumber, setReactionBroadcasterTicketNumber] = useState(null);
    const broadcastTimerRef = useRef(null);
    const cooldownTimerRef = useRef(null);
    const trainSyncAfterPassTimerRef = useRef(null);
    // 모바일에서 배경이 스크롤된 만큼 상단 패널도 같이 움직이게 한다.
    const [roomPanY, setRoomPanY] = useState(0);
    // 모바일에서 아래로 스크롤하면 헤더를 숨기고, 맨 위로 돌아오면 다시 보인다.
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);
    // 서버가 알려 준 접속자 목록과 내 좌석 번호(입석이면 null)
    const [roomState, setRoomState] = useState(null);
    const [roomError, setRoomError] = useState(null);
    // 서버가 마지막으로 보내 준 승객 카드(PASSENGER_CARD)
    const [passengerCard, setPassengerCard] = useState(null);
    const socketRef = useRef(null);
    // 지금 전광판에 나오는 방송 id. 리액션을 보낼 때 필요하다.
    const broadcastIdRef = useRef(null);
    // 서버가 알려 준 내 승차권 번호(ROOM_STATE.myTicketNumber)
    const myTicketNumberRef = useRef(null);

    // 열차가 지나갈 때마다 몽실 역장의 안내 패널을 띄우고, 몇 초 뒤 저절로 닫습니다. 객체로 두어 열차가 또 지나가면 시간을 다시 잽니다.
    const [trainChat, setTrainChat] = useState(null);
    // 사라지는 연출 중인지
    const [isTrainChatClosing, setIsTrainChatClosing] = useState(false);

    const syncTrainFromApi = useCallback(async () =>
    {
        if (!trip?.ticketId)
        {
            return;
        }

        try
        {
            const snapshot = await syncWaitingRoomTicket(trip.ticketId);

            if (snapshot?.trainCount != null)
            {
                setPassedTrains(snapshot.trainCount);
            }

            EventBus.emit(WAITING_ROOM_TRAIN_CLOCK_SYNC);
        }
        catch
        {
            const fallback = countPassedTrains(readOnboardingTrip());

            if (fallback != null)
            {
                setPassedTrains(fallback);
            }
        }
    }, [trip?.ticketId]);

    useEffect(() =>
    {
        const handleTrainPassed = () =>
        {
            setTrainChat({});

            if (trainSyncAfterPassTimerRef.current)
            {
                clearTimeout(trainSyncAfterPassTimerRef.current);
            }

            trainSyncAfterPassTimerRef.current = setTimeout(() =>
            {
                trainSyncAfterPassTimerRef.current = null;
                syncTrainFromApi();
            }, TRAIN_COUNT_SYNC_AFTER_PASS_MS);
        };

        EventBus.on('train-passed', handleTrainPassed);

        return () =>
        {
            EventBus.off('train-passed', handleTrainPassed);

            if (trainSyncAfterPassTimerRef.current)
            {
                clearTimeout(trainSyncAfterPassTimerRef.current);
                trainSyncAfterPassTimerRef.current = null;
            }
        };
    }, [syncTrainFromApi]);

    useEffect(() =>
    {
        if (!trainChat)
        {
            return undefined;
        }

        setIsTrainChatClosing(false);

        const closeTimer = setTimeout(() => setIsTrainChatClosing(true), TRAIN_CHAT_MS - CHAT_EXIT_MS);
        const removeTimer = setTimeout(() => setTrainChat(null), TRAIN_CHAT_MS);

        return () =>
        {
            clearTimeout(closeTimer);
            clearTimeout(removeTimer);
        };
    }, [trainChat]);

    useEffect(() =>
    {
        const handleRoomPan = (panY) =>
        {
            setRoomPanY(panY);
            setIsHeaderHidden((hidden) => (panY < -HEADER_HIDE_PAN ? true : panY > -HEADER_SHOW_PAN ? false : hidden));
        };

        const handleStationMasterAnchor = (anchor) => setStationMasterAnchor(anchor);

        EventBus.on('room-pan', handleRoomPan);
        EventBus.on('station-master-anchor', handleStationMasterAnchor);

        return () =>
        {
            EventBus.off('room-pan', handleRoomPan);
            EventBus.off('station-master-anchor', handleStationMasterAnchor);
        };
    }, []);

    const [passedTrains, setPassedTrains] = useState(() => countPassedTrains(trip));

    useEffect(() =>
    {
        if (!trip?.ticketId)
        {
            return undefined;
        }

        syncTrainFromApi();

        const pollMs = getTrainSyncPollIntervalMs(readOnboardingTrip());
        const pollTimer = setInterval(syncTrainFromApi, pollMs);

        const handleVisibility = () =>
        {
            if (document.visibilityState === 'visible')
            {
                syncTrainFromApi();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () =>
        {
            clearInterval(pollTimer);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [trip?.ticketId, syncTrainFromApi]);

    const roomName = trip?.roomName ?? null;
    const roomSubtitle = trip?.roomCode ? ROOM_DESCRIPTIONS[trip.roomCode] : null;

    const closeReaction = useCallback(() =>
    {
        setReactionVisible(false);
        setReactionBroadcasterTicketNumber(null);
    }, []);

    const showReactionForBroadcast = useCallback((broadcasterTicketNumber) =>
    {
        // 내가 한 방송에는 리액션 말풍선을 띄우지 않는다. 서버가 알려 준 내 번호도 함께 비교한다.
        const isMine = [trip?.ticketNumber, myTicketNumberRef.current].some((mine) => mine != null && Number(mine) === Number(broadcasterTicketNumber));

        if (broadcasterTicketNumber == null || isMine)
        {
            closeReaction();
            return;
        }

        setReactionBroadcasterTicketNumber(broadcasterTicketNumber);
        setReactionVisible(true);
    }, [closeReaction, trip?.ticketNumber]);

    const clearBroadcastTimers = useCallback(() =>
    {
        if (broadcastTimerRef.current)
        {
            clearTimeout(broadcastTimerRef.current);
            broadcastTimerRef.current = null;
        }

        if (cooldownTimerRef.current)
        {
            clearTimeout(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
        }
    }, []);

    const playIncomingBroadcast = useCallback((message, broadcasterTicketNumber) =>
    {
        clearBroadcastTimers();
        closeReaction();
        setBroadcastMessage(message);
        setBroadcastPhase('broadcasting');
        showReactionForBroadcast(broadcasterTicketNumber);

        // 전광판에 방송이 뜰 때 안내 효과음을 낸다. 자동재생 차단 등으로 실패해도 무시한다.
        const announce = new Audio('/assets/sounds/announce.mp3');

        announce.volume = 0.5;
        announce.play().catch(() => {});

        // 새로고침해도 대기 시간이 이어지도록 방송이 완전히 끝나는 시각을 저장해 둔다.
        try
        {
            localStorage.setItem(cooldownStorageKey, String(Date.now() + BROADCAST_DURATION_MS + BROADCAST_COOLDOWN_MS));
        }
        catch { /* 저장소를 못 써도 방송은 그대로 동작한다 */ }

        broadcastTimerRef.current = setTimeout(() =>
        {
            closeReaction();
            setCooldownEndsAt(Date.now() + BROADCAST_COOLDOWN_MS);
            setBroadcastPhase('cooldown');

            cooldownTimerRef.current = setTimeout(() =>
            {
                setBroadcastPhase('idle');
                setBroadcastMessage('');
            }, BROADCAST_COOLDOWN_MS);
        }, BROADCAST_DURATION_MS);
    }, [clearBroadcastTimers, closeReaction, cooldownStorageKey, showReactionForBroadcast]);

    // 새로고침 직후 아직 방송 대기 시간이 남았다면 그 시간만큼 다시 막는다. (방송 문구는 복원하지 않는다)
    useEffect(() =>
    {
        let endsAt = 0;

        try
        {
            endsAt = Number(localStorage.getItem(cooldownStorageKey)) || 0;
        }
        catch { /* 저장소를 못 읽으면 처음부터 쓸 수 있게 둔다 */ }

        const remaining = endsAt - Date.now();

        if (remaining <= 0)
        {
            return;
        }

        setCooldownEndsAt(endsAt);
        setBroadcastPhase('cooldown');
        cooldownTimerRef.current = setTimeout(() => setBroadcastPhase('idle'), remaining);
    }, [cooldownStorageKey]);

    useEffect(() =>
    {
        let cancelled = false;

        const loadData = async () =>
        {
            setStatsLoading(true);

            try
            {
                const stats = await fetchWaitingRoomMarqueeStats();

                if (!cancelled)
                {
                    setMarqueeStats(stats);
                }
            }
            finally
            {
                if (!cancelled)
                {
                    setStatsLoading(false);
                }
            }
        };

        loadData();

        return () =>
        {
            cancelled = true;
        };
    }, [trip?.ticketId]);

    useEffect(() =>
    {
        return () =>
        {
            clearBroadcastTimers();
        };
    }, [clearBroadcastTimers]);

    useEffect(() =>
    {
        if (trip?.ticketNumber == null)
        {
            return undefined;
        }

        const bindLocalPlayer = () =>
        {
            EventBus.emit(WAITING_ROOM_BIND_LOCAL_PLAYER, { ticketId: trip.ticketNumber });
        };

        bindLocalPlayer();
        EventBus.on('current-scene-ready', bindLocalPlayer);

        return () =>
        {
            EventBus.off('current-scene-ready', bindLocalPlayer);
        };
    }, [trip?.ticketNumber]);

    useEffect(() =>
    {
        const handleRemoteBroadcast = ({ message, broadcasterTicketNumber }) =>
        {
            if (!message)
            {
                return;
            }

            playIncomingBroadcast(message, broadcasterTicketNumber);
        };

        EventBus.on(WAITING_ROOM_BROADCAST_RECEIVED, handleRemoteBroadcast);

        return () =>
        {
            EventBus.off(WAITING_ROOM_BROADCAST_RECEIVED, handleRemoteBroadcast);
        };
    }, [playIncomingBroadcast]);

    // 소켓으로 대기실에 입장한다. 접속자 목록은 상태에 담고, 방송·리액션·에러는 이벤트별로 처리한다.
    useEffect(() =>
    {
        if (!trip?.roomCode || !trip?.ticketId)
        {
            return undefined;
        }

        const handleRoomEvent = (message) =>
        {
            if (message.type === 'BROADCAST')
            {
                setRoomError(null);
                broadcastIdRef.current = message.broadcastId;
                EventBus.emit(WAITING_ROOM_BROADCAST_RECEIVED, {
                    message: message.sentence,
                    broadcasterTicketNumber: message.ticketNumber
                });
            }

            if (message.type === 'PASSENGER_CARD')
            {
                setPassengerCard(message);
            }

            if (message.type === 'REACTION' && message.ticketNumber !== trip.ticketNumber)
            {
                // 내 리액션은 누른 순간 이미 보여 줬으므로 다른 승객 것만 띄운다.
                EventBus.emit(WAITING_ROOM_REACTION_REMOTE, {
                    ticketId: message.ticketNumber,
                    reactionType: SERVER_TO_REACTION[message.reaction]
                });
            }
            else if (message.type === 'ERROR')
            {
                setRoomError(message.message);
            }
        };

        const socket = connectWaitingRoom({
            roomCode: trip.roomCode,
            ticketId: trip.ticketId,
            onState: (state) =>
            {
                myTicketNumberRef.current = state.myTicketNumber;
                setRoomState(state);
            },
            onEvent: handleRoomEvent,
            onFatal: () => setRoomError('대기실에 연결하지 못했어요. 다시 접속해 주세요.')
        });
        const handleMyReaction = ({ reactionType }) =>
        {
            if (broadcastIdRef.current && REACTION_TO_SERVER[reactionType])
            {
                socket.sendReaction({ broadcastId: broadcastIdRef.current, reaction: REACTION_TO_SERVER[reactionType] });
            }
        };

        socketRef.current = socket;
        EventBus.on(WAITING_ROOM_REACTION_EVENT, handleMyReaction);

        return () =>
        {
            EventBus.off(WAITING_ROOM_REACTION_EVENT, handleMyReaction);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [trip?.roomCode, trip?.ticketId, trip?.ticketNumber]);

    // 접속자 목록을 Phaser 씬에 전달한다. 씬이 늦게 준비돼도 받을 수 있게 준비 이벤트에도 다시 보낸다.
    useEffect(() =>
    {
        if (!roomState)
        {
            return undefined;
        }

        const sendPassengers = () => EventBus.emit(WAITING_ROOM_PASSENGERS, roomState);

        sendPassengers();
        EventBus.on('current-scene-ready', sendPassengers);

        return () =>
        {
            EventBus.off('current-scene-ready', sendPassengers);
        };
    }, [roomState]);

    // 카드 컴포넌트가 승객이 바뀔 때마다 요청하므로 함수가 매 렌더 바뀌지 않게 둔다.
    const handleRequestPassengerCard = useCallback((ticketNumber) =>
    {
        socketRef.current?.requestPassengerCard({ ticketNumber });
    }, []);

    const handleEndWaiting = () => navigate('/finish-waiting');

    const handleOpenBroadcast = () =>
    {
        if (broadcastPhase !== 'idle')
        {
            return;
        }

        setBroadcastPhase('composing');
    };

    const handleCloseBroadcastModal = () =>
    {
        setBroadcastPhase('idle');
    };

    // 방송은 서버로 보내고, 전광판에는 서버가 순서대로 보내 주는 BROADCAST가 올 때 뜬다.
    const handleSendBroadcast = ({ situationChipCode, moodChip }) =>
    {
        setRoomError(null);
        socketRef.current?.sendBroadcast({ situationChipCode, moodChip });
        setBroadcastPhase('idle');
    };

    const broadcastDisabled = broadcastPhase !== 'idle';

    // 방송 중이거나 대기 시간(쿨타임)일 때 버튼에 남은 초를 보여 주기 위해 1초마다 줄인다.
    const isBroadcastBlocked = broadcastPhase === 'broadcasting' || broadcastPhase === 'cooldown';
    const cooldownLeft = broadcastPhase === 'cooldown' && cooldownEndsAt
        ? Math.min(Math.max(Math.ceil((cooldownEndsAt - now) / 1000), 1), BROADCAST_COOLDOWN_MS / 1000)
        : BROADCAST_COOLDOWN_MS / 1000;

    useEffect(() =>
    {
        if (broadcastPhase !== 'cooldown')
        {
            return undefined;
        }

        const intervalId = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(intervalId);
    }, [broadcastPhase]);

    return (
        <main className={isHeaderHidden ? 'waiting-room waiting-room-header-hidden' : 'waiting-room'}>
            <AppHeader />
            <div className="waiting-room-stage">
                <PhaserGame />
                <WaitingRoomWoolLabel />
                <WoolTokPanel />
                <PassengerCard response={passengerCard} onRequest={handleRequestPassengerCard} />
                {trainChat && (
                    <div className="waiting-room-train-chat">
                        <ChatPanel
                            portrait="portrait04"
                            closing={isTrainChatClosing}
                            typing
                            message={'열차가 지나갔어요. 털실 한 올 놓아 둘게요,\n심심할 때 만져 봐도 좋아요.'}
                        />
                    </div>
                )}
                <div className="waiting-room-overlay" style={{ '--room-pan-y': `${roomPanY}px` }}>
                    <WaitingRoomTopBar
                        roomName={roomName}
                        roomSubtitle={roomSubtitle}
                        waitingCount={roomState ? roomState.passengers.length : null}
                        standingCount={roomState ? roomState.passengers.filter((item) => item.seatNumber == null).length : 0}
                    />
                    <WaitingRoomMarquee
                        arrivalCount={statsLoading ? null : marqueeStats.arrivalCount}
                        releasedCount={statsLoading ? null : marqueeStats.releasedCount}
                        phase={broadcastPhase === 'composing' ? 'idle' : broadcastPhase}
                        broadcastMessage={broadcastMessage}
                    />
                </div>
                <WaitingRoomReactionBubble
                    anchor={stationMasterAnchor}
                    broadcasterTicketNumber={reactionBroadcasterTicketNumber}
                    reactingTicketId={trip?.ticketNumber}
                    isVisible={reactionVisible}
                    onDismiss={closeReaction}
                />
                {roomError && <p className="waiting-room-error" role="alert">{roomError}</p>}
                <WaitingRoomBroadcastModal
                    isOpen={broadcastPhase === 'composing'}
                    roomCode={trip?.roomCode}
                    trip={trip}
                    onClose={handleCloseBroadcastModal}
                    onSend={handleSendBroadcast}
                />
                <WaitingRoomActionBar
                    passedTrains={passedTrains}
                    onEndWaiting={handleEndWaiting}
                    onOpenBroadcast={handleOpenBroadcast}
                    broadcastDisabled={broadcastDisabled}
                    broadcastCooldownLeft={isBroadcastBlocked ? cooldownLeft : null}
                />
            </div>
        </main>
    );
}