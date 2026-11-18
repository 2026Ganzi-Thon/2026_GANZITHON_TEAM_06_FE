import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppHeader from '../components/common/AppHeader';
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
import { readOnboardingTrip, ROOM_DESCRIPTIONS } from '../game/onboardingSession';
import {
    WAITING_ROOM_BIND_LOCAL_PLAYER,
    WAITING_ROOM_BROADCAST_RECEIVED
} from '../game/waitingRoomReactionEvents';
import { fetchPassedTrains, fetchWaitingRoomMarqueeStats } from '../services/waitingRoom';

// 헤더가 숨고/다시 나타나는 스크롤 거리(px). 깜빡임을 막으려고 두 값을 다르게 둔다.
const HEADER_HIDE_PAN = 20;
const HEADER_SHOW_PAN = 4;

export default function WaitingRoomPage ()
{
    const navigate = useNavigate();
    const trip = useMemo(() => readOnboardingTrip(), []);
    const [marqueeStats, setMarqueeStats] = useState({
        arrivalCount: null,
        releasedCount: null
    });
    const [passedTrains, setPassedTrains] = useState(null);
    const [statsLoading, setStatsLoading] = useState(Boolean(trip?.roomCode));
    const [broadcastPhase, setBroadcastPhase] = useState('idle');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [reactionVisible, setReactionVisible] = useState(false);
    const [reactionBroadcasterTicketNumber, setReactionBroadcasterTicketNumber] = useState(null);
    const broadcastTimerRef = useRef(null);
    const cooldownTimerRef = useRef(null);
    // 모바일에서 배경이 스크롤된 만큼 상단 패널도 같이 움직이게 한다.
    const [roomPanY, setRoomPanY] = useState(0);
    // 모바일에서 아래로 스크롤하면 헤더를 숨기고, 맨 위로 돌아오면 다시 보인다.
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);

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

    const roomName = trip?.displayName ?? null;
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

        broadcastTimerRef.current = setTimeout(() =>
        {
            closeReaction();
            setBroadcastPhase('cooldown');

            cooldownTimerRef.current = setTimeout(() =>
            {
                setBroadcastPhase('idle');
                setBroadcastMessage('');
            }, BROADCAST_COOLDOWN_MS);
        }, BROADCAST_DURATION_MS);
    }, [clearBroadcastTimers, closeReaction, showReactionForBroadcast]);

    useEffect(() =>
    {
        let cancelled = false;

        const loadData = async () =>
        {
            setStatsLoading(true);

            try
            {
                const [stats, trains] = await Promise.all([
                    fetchWaitingRoomMarqueeStats(),
                    fetchPassedTrains(trip?.ticketId)
                ]);

                if (!cancelled)
                {
                    setMarqueeStats(stats);
                    setPassedTrains(trains);
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

    return (
        <main className={isHeaderHidden ? 'waiting-room waiting-room-header-hidden' : 'waiting-room'}>
            <AppHeader />
            <div className="waiting-room-stage">
                <PhaserGame />
                <WaitingRoomWoolLabel />
                <WoolTokPanel />
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
                    passedTrains={statsLoading ? null : passedTrains}
                    onEndWaiting={handleEndWaiting}
                    onOpenBroadcast={handleOpenBroadcast}
                    broadcastDisabled={broadcastDisabled}
                />
            </div>
        </main>
    );
}