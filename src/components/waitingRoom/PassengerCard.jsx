import { useEffect, useState } from 'react';

import { toPiece } from '../../data/pieces';
import { EventBus } from '../../game/EventBus';
import { requestPassengerCard } from '../../services/passengerCard';
import BlanketArt from '../common/BlanketArt';

// 머문 시간을 'N시간 M분' / 'M분'으로 보여 줍니다.
function formatStay (startedTs)
{
    const minutes = Math.floor((Date.now() - startedTs) / 60_000);

    if (minutes < 1)
    {
        return '1분 미만';
    }

    const hours = Math.floor(minutes / 60);

    return hours ? `${hours}시간 ${minutes % 60}분` : `${minutes}분`;
}

// 대기실에서 다른 승객의 양을 누르면 뜨는 승객 카드.
// 공개(PUBLIC) 승객은 담요 조각과 지나간 열차 수를, 그 외(비공개·조각 없음·비로그인)는 머문 시간만 보여 줍니다.
export default function PassengerCard ({ roomCode })
{
    // 탭한 승객. 같은 양을 다시 눌러도 새로 불러오도록 객체로 둔다.
    const [target, setTarget] = useState(null);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState('');

    useEffect(() =>
    {
        const handleOpen = ({ ticketNumber }) =>
        {
            setError('');
            setTarget({ ticketNumber });
        };

        EventBus.on('passenger-card-open', handleOpen);

        return () => EventBus.off('passenger-card-open', handleOpen);
    }, []);

    // 다른 양을 누르거나 닫으면 이전 응답은 버린다.
    useEffect(() =>
    {
        if (!target)
        {
            return undefined;
        }

        let cancelled = false;

        (async () =>
        {
            try
            {
                const data = await requestPassengerCard(roomCode, target.ticketNumber);

                if (!cancelled)
                {
                    setResponse(data);
                }
            }
            catch (e)
            {
                if (!cancelled)
                {
                    setError(e.message);
                }
            }
        })();

        return () =>
        {
            cancelled = true;
        };
    }, [roomCode, target]);

    useEffect(() =>
    {
        if (!target)
        {
            return undefined;
        }

        const handleKey = (event) =>
        {
            if (event.key === 'Escape')
            {
                setTarget(null);
            }
        };

        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
    }, [target]);

    const handleClose = () => setTarget(null);

    if (!target)
    {
        return null;
    }

    // 닫았다가 다른 양을 열면 이전 승객의 응답이 남아 있으므로, 지금 탭한 승객의 응답만 보여 준다.
    const card = response?.ticketNumber === target.ticketNumber ? response : null;
    const isPublic = card?.visibility === 'PUBLIC';
    const pieces = isPublic ? card.patternCodes.map((patternCode, i) => toPiece({ patternCode }, i)) : [];

    return (
        <div className="passenger-card-layer">
            <button type="button" className="passenger-card-backdrop" aria-label="승객 카드 닫기" onClick={handleClose} />
            <section className={isPublic ? 'passenger-card is-public' : 'passenger-card'} role="dialog" aria-modal="true" aria-labelledby="passenger-card-title">
                <h2 id="passenger-card-title" className="passenger-card-title">
                    {card ? `${card.displayName}님` : `${target.ticketNumber}번 승객`}
                </h2>
                {error && <p className="passenger-card-row" role="alert">{error}</p>}
                {!card && !error && <p className="passenger-card-row">불러오는 중이에요...</p>}
                {card && (
                    <>
                        {isPublic && (
                            <div className="passenger-card-blanket">
                                <div className="my-sheep-blanket">
                                    <BlanketArt pieces={pieces} alt={`${card.displayName}님의 담요`} />
                                </div>
                            </div>
                        )}
                        <p className="passenger-card-row">머문 시간: {formatStay(card.startedTs)}</p>
                        {isPublic && <p className="passenger-card-row">지나간 열차: {card.trainCount}대</p>}
                    </>
                )}
            </section>
        </div>
    );
}
