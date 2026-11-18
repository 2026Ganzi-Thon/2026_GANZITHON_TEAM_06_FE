import { useEffect, useMemo, useState } from 'react';

import AppHeader from '../components/common/AppHeader';
import WaitingRoomActionBar from '../components/waitingRoom/WaitingRoomActionBar';
import WaitingRoomMarquee from '../components/waitingRoom/WaitingRoomMarquee';
import WaitingRoomTopBar from '../components/waitingRoom/WaitingRoomTopBar';
import { PhaserGame } from '../PhaserGame';
import { readOnboardingTrip, ROOM_DESCRIPTIONS } from '../game/onboardingSession';
import { fetchRoomStats } from '../services/waitingRoom';

export default function WaitingRoomPage ()
{
    const trip = useMemo(() => readOnboardingTrip(), []);
    const [stats, setStats] = useState({
        waitingCount: 0,
        arrivalCount: 0,
        releasedCount: 0,
        passedTrains: 0
    });
    const [statsLoading, setStatsLoading] = useState(Boolean(trip?.roomCode));

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

    const handleEndWaiting = () =>
    {
        window.alert('기다림 마치기 화면은 준비 중이에요.');
    };

    const waitingCount = statsLoading ? null : stats.waitingCount;

    return (
        <main className="waiting-room">
            <AppHeader />
            <div className="waiting-room-stage">
                <PhaserGame />
                <div className="waiting-room-overlay">
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