import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppHeader from '../components/common/AppHeader';
import WaitingRoomActionBar from '../components/waitingRoom/WaitingRoomActionBar';
import WaitingRoomMarquee from '../components/waitingRoom/WaitingRoomMarquee';
import WaitingRoomTopBar from '../components/waitingRoom/WaitingRoomTopBar';
import WaitingRoomWoolLabel from '../components/waitingRoom/WaitingRoomWoolLabel';
import WoolTokPanel from '../components/waitingRoom/woolTok/WoolTokPanel';
import { PhaserGame } from '../PhaserGame';
import { EventBus } from '../game/EventBus';
import { readOnboardingTrip, ROOM_DESCRIPTIONS } from '../game/onboardingSession';
import { fetchRoomStats } from '../services/waitingRoom';

// 헤더가 숨고/다시 나타나는 스크롤 거리(px). 깜빡임을 막으려고 두 값을 다르게 둔다.
const HEADER_HIDE_PAN = 20;
const HEADER_SHOW_PAN = 4;

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
                    passedTrains={statsLoading ? null : stats.passedTrains}
                    onEndWaiting={handleEndWaiting}
                />
            </div>
        </main>
    );
}