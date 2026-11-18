import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import PanelFrame from '../components/common/PanelFrame';
import StackCarousel from '../components/common/StackCarousel';
import { PIECE_BACK_IMAGE, toPiece, toRecord } from '../data/pieces';
import { readPendingPieces } from '../game/onboardingSession';
import { fetchBlanketPiece, fetchBlanketPieces } from '../services/blanketPieces';

export default function PieceDetailPage()
{
    const navigate = useNavigate();
    const { pieceId } = useParams();

    // 임시 조각함에서 들어왔으면(?from=storage) 임시 조각용 문구로 보여 줍니다.
    const [searchParams] = useSearchParams();
    const isTemp = searchParams.get('from') === 'storage';

    const [isFlipped, setIsFlipped] = useState(false);
    const tempPieces = useMemo(() => readPendingPieces().map(toPiece), []);
    const [serverPieces, setServerPieces] = useState([]);
    // 서버 조각의 뒷면 기록 (조각 상세 API로 현재 조각만 불러옵니다)
    const [detail, setDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(!isTemp);
    const [error, setError] = useState('');
    const pieces = isTemp ? tempPieces : serverPieces;

    useEffect(() => {
        if (isTemp) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const list = await fetchBlanketPieces();
                if (!cancelled) setServerPieces(list.map(toPiece));
            } catch (e) {
                if (!cancelled) setError(e.message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [isTemp]);

    useEffect(() => {
        if (isTemp) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const data = await fetchBlanketPiece(pieceId);
                if (!cancelled) setDetail({ id: pieceId, record: toRecord(data) });
            } catch (e) {
                if (!cancelled) setError(e.message);
            }
        })();
        return () => { cancelled = true; };
    }, [isTemp, pieceId]);

    const index = pieces.findIndex((piece) => piece.id === pieceId);
    const hasMany = pieces.length > 1;

    // 조각을 넘겨도 기록이 쌓이지 않게 replace 로 주소만 바꿉니다.
    // 다른 조각으로 넘어가면 다시 앞면부터 보여 줍니다.
    const handleIndexChange = (next) =>
    {
        setIsFlipped(false);
        navigate(`/my-sheep/piece/${pieces[next].id}${isTemp ? '?from=storage' : ''}`, { replace: true });
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
                                    items={pieces}
                                    keyOf={(piece) => piece.id}
                                    index={index}
                                    onIndexChange={handleIndexChange}
                                    onPressCurrent={handleFlip}
                                    getLabel={(piece) => `${piece.name} 조각`}
                                    renderCard={(piece) => {
                                        const record = piece.record ?? (detail?.id === piece.id ? detail.record : null);

                                        return (
                                        <div className={`my-sheep-flip${piece.id === pieceId && isFlipped ? ' my-sheep-flip--back' : ''}`}>
                                            {piece.image && <img className="my-sheep-flip__face" src={piece.image} alt="" />}
                                            <div className="my-sheep-flip__face my-sheep-flip__face--back my-sheep-back">
                                                <img src={PIECE_BACK_IMAGE} alt="" />
                                                <span className="my-sheep-back__value my-sheep-back__value--room">{record?.room}</span>
                                                <span className="my-sheep-back__value my-sheep-back__value--trains">{record?.trains}</span>
                                                <span className="my-sheep-back__value my-sheep-back__value--ending">{record?.ending}</span>
                                            </div>
                                        </div>
                                        );
                                    }}
                                />
                                {hasMany && (
                                    <button type="button" className="my-sheep-arrow" aria-label="다음 조각" disabled={index === pieces.length - 1} onClick={() => handleIndexChange(index + 1)}>
                                        <img src="/assets/mypage/right.png" alt="" />
                                    </button>
                                )}
                            </div>
                            <p className="my-sheep-piece-label">{isTemp ? '임시 ' : ''}{isFlipped ? '조각 뒷면' : '조각 앞면'}</p>
                            <div className="my-sheep-dots" role="img" aria-label={`${pieces.length}개 중 ${index + 1}번째 조각`}>
                                {pieces.map((item, i) => (
                                    <span key={item.id} className={`my-sheep-dot${i === index ? ' my-sheep-dot--on' : ''}`} />
                                ))}
                            </div>
                            <p className="my-sheep-piece-label">탭하면 뒤집혀요</p>
                        </>
                    ) : (
                        <p className="my-sheep-desc">
                            {isLoading ? '불러오는 중이에요...' : error || '조각을 찾을 수 없어요.'}
                        </p>
                    )}
                </div>
            </PanelFrame>
        </main>
    );
}
