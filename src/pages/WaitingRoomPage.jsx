import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppHeader from '../components/common/AppHeader';
import ChatPanel from '../components/common/ChatPanel';
import WaitingRoomActionBar from '../components/waitingRoom/WaitingRoomActionBar';
import WaitingRoomMarquee from '../components/waitingRoom/WaitingRoomMarquee';
import WaitingRoomTopBar from '../components/waitingRoom/WaitingRoomTopBar';
import WaitingRoomWoolLabel from '../components/waitingRoom/WaitingRoomWoolLabel';
import WoolTokPanel from '../components/waitingRoom/woolTok/WoolTokPanel';
import { PhaserGame } from '../PhaserGame';
import { EventBus } from '../game/EventBus';
import { countPassedTrains, readOnboardingTrip, ROOM_DESCRIPTIONS } from '../game/onboardingSession';
import { fetchRoomStats } from '../services/waitingRoom';

// 헤더가 숨고/다시 나타나는 스크롤 거리(px). 깜빡임을 막으려고 두 값을 다르게 둔다.
const HEADER_HIDE_PAN = 20;
const HEADER_SHOW_PAN = 4;
// 열차 안내 패널이 떠 있는 시간(ms)
const TRAIN_CHAT_MS = 6000;
// 안내 패널이 내려가며 사라지는 시간(ms). finish-waiting.css의 chat-panel-fall 길이와 같게 둔다.
const CHAT_EXIT_MS = 350;

export default function WaitingRoomPage ()
{
    const navigate = useNavigate();
    const trip = useMemo(() => readOnboardingTrip(), []);
    const [stats, setStats] = useState({
        waitingCount: 0,
        arrivalCount: 0,
        releasedCount: 0,
        passedTrains: 0
    });
    const [statsLoading, setStatsLoading] = useState(Boolean(trip?.roomCode));
    // 모바일에서 배경이 스크롤된 만큼 상단 패널도 같이 움직이게 한다.
    const [roomPanY, setRoomPanY] = useState(0);
    // 모바일에서 아래로 스크롤하면 헤더를 숨기고, 맨 위로 돌아오면 다시 보인다.
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);

    // 열차가 지나갈 때마다 몽실 역장의 안내 패널을 띄우고, 몇 초 뒤 저절로 닫습니다. 객체로 두어 열차가 또 지나가면 시간을 다시 잽니다.
    const [trainChat, setTrainChat] = useState(null);
    // 사라지는 연출 중인지
    const [isTrainChatClosing, setIsTrainChatClosing] = useState(false);

    useEffect(() =>
    {
        const handleTrainPassed = () => setTrainChat({});

        EventBus.on('train-passed', handleTrainPassed);

        return () => EventBus.off('train-passed', handleTrainPassed);
    }, []);

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

    // 지나간 열차 수는 기다림 시작 시각 기준으로 계산해 누적합니다. 새로고침해도 이어집니다.
    const [passedTrains, setPassedTrains] = useState(() => countPassedTrains(trip));

    useEffect(() =>
    {
        const timer = setInterval(() => setPassedTrains(countPassedTrains(trip)), 1000);

        return () => clearInterval(timer);
    }, [trip]);

    const roomName = trip?.roomName ?? null;
    const roomSubtitle = trip?.roomCode ? ROOM_DESCRIPTIONS[trip.roomCode] : null;

    useEffect(() =>
    {
        if (!trip?.roomCode)
        {
            return;
        }

        let cancelled = false;

        const loadStats = async () =>
        {
            setStatsLoading(true);

            try
            {
                const nextStats = await fetchRoomStats(trip.roomCode);

                if (!cancelled)
                {
                    setStats(nextStats);
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

        loadStats();

        return () =>
        {
            cancelled = true;
        };
    }, [trip?.roomCode]);

    const handleEndWaiting = () => navigate('/finish-waiting');

    const waitingCount = statsLoading ? null : stats.waitingCount;

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
                        waitingCount={waitingCount}
                    />
                    <WaitingRoomMarquee
                        arrivalCount={statsLoading ? null : stats.arrivalCount}
                        releasedCount={statsLoading ? null : stats.releasedCount}
                    />
                </div>
                <WaitingRoomActionBar
                    passedTrains={passedTrains}
                    onEndWaiting={handleEndWaiting}
                />
            </div>
        </main>
    );
}