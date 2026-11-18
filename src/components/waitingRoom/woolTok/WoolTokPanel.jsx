import { useEffect, useState } from 'react';

import { EventBus } from '../../../game/EventBus';
import WoolTokHeader from './WoolTokHeader';
import WoolTokPattern from './WoolTokPattern';

const TOAST_DURATION_MS = 5000;

// 털실을 누르면 열리는 털실 톡톡 패널.
export default function WoolTokPanel ()
{
    const [isOpen, setIsOpen] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [isToastVisible, setIsToastVisible] = useState(false);
    // TODO: 털실 톡톡 기능 구현 시 실제 개수로 교체
    const woolCount = 3;

    useEffect(() =>
    {
        const handleOpen = () => setIsOpen(true);

        EventBus.on('wool-tok-open', handleOpen);

        return () => EventBus.off('wool-tok-open', handleOpen);
    }, []);

    // 안내 문구는 5초 뒤에 사라진다.
    useEffect(() =>
    {
        if (!isToastVisible)
        {
            return;
        }

        const timer = setTimeout(() => setIsToastVisible(false), TOAST_DURATION_MS);

        return () => clearTimeout(timer);
    }, [isToastVisible]);

    const handleClose = () => setIsOpen(false);

    // 대기실로 돌아가 털실을 wool03으로 바꾸고, 안내 문구를 보여준다.
    const handleDeliver = () =>
    {
        EventBus.emit('wool-deliver');
        setIsOpen(false);
        setIsToastVisible(true);
    };

    const toast = isToastVisible && (
        <p className="wool-tok-toast" role="status">
            정성껏 풀어두신 마음은 역장이 잘 챙겨둘게요. 기다림이 끝나면 담요 조각으로 받아보실 수 있어요.
        </p>
    );

    return (
        <>
        {/* 닫아도 도안 상태가 남도록 언마운트하지 않고 숨긴다. */}
        <div className="wool-panel-backdrop" hidden={!isOpen}>
            <section className="wool-panel" aria-label="털실 톡톡">
                <WoolTokHeader woolCount={woolCount} onClose={handleClose} />
                <div className="wool-panel-body">
                    <WoolTokPattern onCompleteChange={setIsComplete} />
                    <button type="button" className="wool-panel-change">
                        <img src="/assets/wool/revert-icon.png" alt="" />
                        도안 바꾸기 · 털실 1올
                    </button>
                    <button type="button" className="wool-panel-deliver" disabled={!isComplete} onClick={handleDeliver}>역장에게 전달하기</button>
                </div>
            </section>
        </div>
        {toast}
        </>
    );
}
