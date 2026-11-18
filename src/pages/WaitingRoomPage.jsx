import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppHeader from '../components/common/AppHeader';
import ChatPanel from '../components/common/ChatPanel';
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
    WAITING_ROOM_BROADCAST_RECEIVED
} from '../game/waitingRoomReactionEvents';
import {
    fetchWaitingRoomMarqueeStats,
    getTrainSyncPollIntervalMs,
    syncWaitingRoomTicket,
    WAITING_ROOM_TRAIN_CLOCK_SYNC
} from '../services/waitingRoom';

// 헤더가 숨고/다시 나타나는 스크롤 거리(px). 깜빡임을 막으려고 두 값을 다르게 둔다.
const HEADER_HIDE_PAN = 20;
const HEADER_SHOW_PAN = 4;
// 열차 안내 패널이 떠 있는 시간(ms)
const TRAIN_CHAT_MS = 6000;
// 안내 패널이 내려가며 사라지는 시간(ms). finish-waiting.css의 chat-panel-fall 길이와 같게 둔다.
const CHAT_EXIT_MS = 350;
const TRAIN_COUNT_SYNC_AFTER_PASS_MS = 1500;

export default function WaitingRoomPage ()
{
    const navigate = useNavigate();
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
    const [reactionBroadcasterTicketNumber, setReactionBroadcasterTicketNumber] = useState(null);
    const broadcastTimerRef = useRef(null);
    const cooldownTimerRef = useRef(null);
    const trainSyncAfterPassTimerRef = useRef(null);
    // 모바일에서 배경이 스크롤된 만큼 상단 패널도 같이 움직이게 한다.
    const [roomPanY, setRoomPanY] = useState(0);
    // 모바일에서 아래로 스크롤하면 헤더를 숨기고, 맨 위로 돌아오면 다시 보인다.
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);

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

        EventBus.on('room-pan', handleRoomPan);

        return () => EventBus.off('room-pan', handleRoomPan);
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
        if (broadcasterTicketNumber == null || broadcasterTicketNumber === trip?.ticketNumber)
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
        if (!trip?.ticketId)
        {
            return undefined;
        }

        const bindLocalPlayer = () =>
        {
            EventBus.emit(WAITING_ROOM_BIND_LOCAL_PLAYER, { ticketId: trip.ticketId });
        };

        bindLocalPlayer();
        EventBus.on('current-scene-ready', bindLocalPlayer);

        return () =>
        {
            EventBus.off('current-scene-ready', bindLocalPlayer);
        };
    }, [trip?.ticketId]);

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

    const handleSendBroadcast = ({ message }) =>
    {
        playIncomingBroadcast(message, trip?.ticketNumber);
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
                {trainChat && (
                    <div className="waiting-room-train-chat">
                        <ChatPanel
                            portrait="portrait04"
                            closing={isTrainChatClosing}
                            message={'열차가 지나갔어요. 털실 한 올 놓아 둘게요,\n심심할 때 만져 봐도 좋아요.'}
                        />
                    </div>
                )}
                <div className="waiting-room-overlay" style={{ '--room-pan-y': `${roomPanY}px` }}>
                    <WaitingRoomTopBar
                        roomName={roomName}
                        roomSubtitle={roomSubtitle}
                        waitingCount={null}
                    />
                    <WaitingRoomMarquee
                        arrivalCount={statsLoading ? null : marqueeStats.arrivalCount}
                        releasedCount={statsLoading ? null : marqueeStats.releasedCount}
                        phase={broadcastPhase === 'composing' ? 'idle' : broadcastPhase}
                        broadcastMessage={broadcastMessage}
                    />
                </div>
                <WaitingRoomReactionBubble
                    broadcasterTicketNumber={reactionBroadcasterTicketNumber}
                    reactingTicketId={trip?.ticketId}
                    isVisible={reactionVisible}
                    onDismiss={closeReaction}
                />
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