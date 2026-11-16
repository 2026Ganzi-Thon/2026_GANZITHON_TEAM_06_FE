import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import PageLinks from '../components/common/PageLinks';
import PanelFrame from '../components/common/PanelFrame';
import StackCarousel from '../components/common/StackCarousel';
import { PIECES, PIECE_BACK_IMAGE } from '../data/pieces';

export default function PieceDetailPage()
{
    const navigate = useNavigate();
    const { pieceId } = useParams();

    // 임시 조각함에서 들어왔으면(?from=storage) 임시 조각용 문구로 보여 줍니다.
    const [searchParams] = useSearchParams();
    const isTemp = searchParams.get('from') === 'storage';

    const [isFlipped, setIsFlipped] = useState(false);

    const index = PIECES.findIndex((piece) => piece.id === pieceId);
    const hasMany = PIECES.length > 1;

    // 조각을 넘겨도 기록이 쌓이지 않게 replace 로 주소만 바꿉니다.
    // 다른 조각으로 넘어가면 다시 앞면부터 보여 줍니다.
    const handleIndexChange = (next) =>
    {
        setIsFlipped(false);
        navigate(`/my-sheep/piece/${PIECES[next].id}${isTemp ? '?from=storage' : ''}`, { replace: true });
    };

    const handleFlip = () => setIsFlipped((prev) => !prev);

    return (
        <main className="my-sheep-page">
            <PanelFrame fallbackTo="/my-sheep?tab=storage">
                <div className="my-sheep-content">
                    <h2 className="my-sheep-title">조각 상세</h2>
                    {index >= 0 ? (
                        <>
                            <p className="my-sheep-desc">기다림의 한 순간을 담은 조각이에요.</p>
                            {isTemp ? (
                                <p className="my-sheep-private">
                                    <span className="my-sheep-private__dot" aria-hidden="true">!</span>
                                    브라우저를 지우면 사라질 수 있어요.
                                </p>
                            ) : (
                                isFlipped && (
                                    <p className="my-sheep-private">
                                        <img src="/assets/mypage/lock.png" alt="" />
                                        나만 보여요.
                                    </p>
                                )
                            )}
                            <div className="my-sheep-viewer">
                                {hasMany && (
                                    <button type="button" className="my-sheep-arrow" aria-label="이전 조각" disabled={index === 0} onClick={() => handleIndexChange(index - 1)}>
                                        <img src="/assets/mypage/left.png" alt="" />
                                    </button>
                                )}
                                <StackCarousel
                                    items={PIECES}
                                    keyOf={(piece) => piece.id}
                                    index={index}
                                    onIndexChange={handleIndexChange}
                                    onPressCurrent={handleFlip}
                                    getLabel={(piece) => `${piece.name} 조각`}
                                    renderCard={(piece) => (
                                        <div className={`my-sheep-flip${piece.id === pieceId && isFlipped ? ' my-sheep-flip--back' : ''}`}>
                                            <img className="my-sheep-flip__face" src={piece.image} alt="" />
                                            <div className="my-sheep-flip__face my-sheep-flip__face--back my-sheep-back">
                                                <img src={PIECE_BACK_IMAGE} alt="" />
                                                <span className="my-sheep-back__value my-sheep-back__value--room">{piece.record.room}</span>
                                                <span className="my-sheep-back__value my-sheep-back__value--trains">{piece.record.trains}</span>
                                                <span className="my-sheep-back__value my-sheep-back__value--ending">{piece.record.ending}</span>
                                            </div>
                                        </div>
                                    )}
                                />
                                {hasMany && (
                                    <button type="button" className="my-sheep-arrow" aria-label="다음 조각" disabled={index === PIECES.length - 1} onClick={() => handleIndexChange(index + 1)}>
                                        <img src="/assets/mypage/right.png" alt="" />
                                    </button>
                                )}
                            </div>
                            <p className="my-sheep-piece-label">{isTemp ? '임시 ' : ''}{isFlipped ? '조각 뒷면' : '조각 앞면'}</p>
                            <div className="my-sheep-dots" role="img" aria-label={`${PIECES.length}개 중 ${index + 1}번째 조각`}>
                                {PIECES.map((item, i) => (
                                    <span key={item.id} className={`my-sheep-dot${i === index ? ' my-sheep-dot--on' : ''}`} />
                                ))}
                            </div>
                            <p className="my-sheep-piece-label">탭하면 뒤집혀요</p>
                        </>
                    ) : (
                        <p className="my-sheep-desc">조각을 찾을 수 없어요.</p>
                    )}
                </div>
            </PanelFrame>
            <PageLinks />
        </main>
    );
}
