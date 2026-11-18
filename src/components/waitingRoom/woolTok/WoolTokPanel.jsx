import { useEffect, useState } from 'react';

import { EventBus } from '../../../game/EventBus';
import { readOnboardingTrip } from '../../../game/onboardingSession';
import { changeKnittingPattern, fetchTicket } from '../../../services/tickets';
import WoolTokHeader from './WoolTokHeader';
import WoolTokPattern from './WoolTokPattern';

const TOAST_DURATION_MS = 5000;
// 패널이 열려 있는 동안 남은 털실을 다시 불러오는 간격
const YARN_REFRESH_MS = 5000;

// 털실을 누르면 열리는 털실 톡톡 패널.
export default function WoolTokPanel ()
{
    const [isOpen, setIsOpen] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [isToastVisible, setIsToastVisible] = useState(false);
    // 서버가 정한 현재 도안과 남은 털실. 도안은 '도안 바꾸기'를 누를 때만 바뀐다.
    const [knitting, setKnitting] = useState(null);
    const [error, setError] = useState('');
    const [isChanging, setIsChanging] = useState(false);
    const woolCount = knitting?.remainingYarnCount ?? 0;

    useEffect(() =>
    {
        const handleOpen = () => setIsOpen(true);

        EventBus.on('wool-tok-open', handleOpen);

        return () => EventBus.off('wool-tok-open', handleOpen);
    }, []);

    // 패널이 열려 있는 동안 승차권 상태를 불러온다. 처음엔 서버가 정한 도안을 가져오고(새로고침해도 유지),
    // 이후엔 열차가 지나가 늘어난 털실 수만 갱신한다. 도안은 '도안 바꾸기'로만 바뀐다.
    useEffect(() =>
    {
        const ticketId = readOnboardingTrip()?.ticketId;

        if (!isOpen || !ticketId)
        {
            return undefined;
        }

        let cancelled = false;

        const load = async () =>
        {
            try
            {
                const ticket = await fetchTicket(ticketId);

                if (!cancelled)
                {
                    setKnitting((prev) => ({
                        patternCode: prev?.patternCode ?? ticket.patternCode,
                        remainingYarnCount: ticket.remainingYarnCount
                    }));
                    setError('');
                }
            }
            catch (e)
            {
                if (!cancelled)
                {
                    setError(e.message);
                }
            }
        };

        load();
        const timer = setInterval(load, YARN_REFRESH_MS);

        return () =>
        {
            cancelled = true;
            clearInterval(timer);
        };
    }, [isOpen]);

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

    // 털실 1올을 쓰고 도안을 다른 걸로 바꾼다. 새 도안은 처음부터 다시 채운다.
    const handleChangePattern = async () =>
    {
        const ticketId = readOnboardingTrip()?.ticketId;

        if (!ticketId || isChanging)
        {
            return;
        }

        setIsChanging(true);
        setError('');

        try
        {
            setKnitting(await changeKnittingPattern(ticketId));
        }
        catch (e)
        {
            setError(e.message);
        }
        finally
        {
            setIsChanging(false);
        }
    };

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
                    {knitting && <WoolTokPattern key={knitting.patternCode} patternCode={knitting.patternCode} onCompleteChange={setIsComplete} />}
                    {error && <p role="alert">{error}</p>}
                    <button type="button" className="wool-panel-change" disabled={!knitting || woolCount < 1 || isChanging} onClick={handleChangePattern}>
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
