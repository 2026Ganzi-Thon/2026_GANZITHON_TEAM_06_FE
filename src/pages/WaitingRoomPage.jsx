import { useEffect, useRef, useState } from 'react';

import PageLinks from '../components/common/PageLinks';
import { PhaserGame } from '../PhaserGame';
import { EventBus } from '../game/EventBus';

export default function WaitingRoomPage()
{
    const phaserRef = useRef(null);
    const [isSeated, setIsSeated] = useState(false);

    useEffect(() =>
    {
        const handleSeated = () => setIsSeated(true);

        EventBus.on('passenger-seated', handleSeated);

        return () =>
        {
            EventBus.off('passenger-seated', handleSeated);
        };
    }, []);

    return (
        <main>
            <h1>대기실</h1>
            <p className="waiting-room-board">잠시 정차합니다. 천천히 가도, 도착은 합니다.</p>
            <PageLinks />
            {isSeated && <p className="waiting-room-line">따뜻한 차 한 잔 놓아 둘게요.</p>}
            <PhaserGame ref={phaserRef} />
        </main>
    );
}
