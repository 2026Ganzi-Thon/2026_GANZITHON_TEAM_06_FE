import { useEffect, useState } from 'react';

import { EventBus } from '../../game/EventBus';

// 털실 밑에 붙는 라벨. 위치와 글자 크기는 Phaser 씬이 알려준다.
export default function WaitingRoomWoolLabel ()
{
    const [label, setLabel] = useState(null);

    useEffect(() =>
    {
        EventBus.on('wool-label', setLabel);

        return () => EventBus.off('wool-label', setLabel);
    }, []);

    if (!label?.visible)
    {
        return null;
    }

    return (
        <span
            className="waiting-room-wool-label"
            style={{ left: label.x, top: label.y, fontSize: label.fontSize }}
        >
            털실 톡톡
        </span>
    );
}
