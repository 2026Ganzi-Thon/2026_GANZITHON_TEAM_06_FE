import { useRef } from 'react';
import PageLinks from '../components/common/PageLinks';
import { PhaserGame } from '../PhaserGame';

export default function WaitingRoomPage()
{
    const phaserRef = useRef(null);

    return (
        <main>
            <h1>대기실</h1>
            <PageLinks />
            <PhaserGame ref={phaserRef} />
        </main>
    );
}
