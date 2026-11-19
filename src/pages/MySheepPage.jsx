import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import AppHeader from '../components/common/AppHeader';
import BlanketArt from '../components/common/BlanketArt';
import PanelFrame from '../components/common/PanelFrame';
import { toPiece } from '../data/pieces';
import { clearOnboardingTrip, readPendingPieces } from '../game/onboardingSession';
import { clearAuth, readAccessToken } from '../services/auth';
import { fetchBlanketPieces } from '../services/blanketPieces';
import { fetchMe, updatePublicSetting } from '../services/users';
import { useBackgroundMusic, useMusicMuted } from '../utils/useBackgroundMusic';

const TABS = [
    { key: 'blanket', label: '내 담요' },
    { key: 'storage', label: '임시 보관' },
];

// 담요 칸을 누르면 그 조각의 상세로 갑니다. 임시 조각(temp)은 임시 보관용 상세 주소로 연결합니다.
const pieceDetailLink = (piece) => `/my-sheep/piece/${piece.id}${piece.temp ? '?from=storage' : ''}`;

export default function MySheepPage()
{
    useBackgroundMusic('/assets/sounds/finish.mp3', 0.3);
    const [isMusicMuted, toggleMusicMuted] = useMusicMuted();
    // 탭을 주소(?tab=)에 두어, 조각 상세에서 뒤로 돌아와도 보던 탭이 유지됩니다.
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') === 'storage' ? 'storage' : 'blanket';
    const location = useLocation();
    // 탭을 바꿔도 exitTo 같은 location.state가 사라지지 않게 함께 넘깁니다.
    const setTab = (key) => setSearchParams({ tab: key }, { replace: true, state: location.state });
    const navigate = useNavigate();
    const exitTo = location.state?.exitTo;
    const isBlanket = tab === 'blanket';
    const [token, setToken] = useState(readAccessToken);
    const [me, setMe] = useState(null);
    const [pieces, setPieces] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLoggedOut, setIsLoggedOut] = useState(false);
    // 임시 조각함: 브라우저에 보관한 비로그인 조각
    const tempPieces = useMemo(() => readPendingPieces().map((data, i) => ({ ...toPiece(data, i), temp: true })), []);
    const isPublic = me?.isPublic ?? false;

    // 로그인 상태면 내 정보와 담요 조각을 불러옵니다.
    useEffect(() => {
        if (!token) return undefined;
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            setError('');
            try {
                const [meData, list] = await Promise.all([fetchMe(), fetchBlanketPieces()]);
                if (cancelled) return;
                setMe(meData);
                setPieces(list.map(toPiece));
            } catch (e) {
                if (cancelled) return;
                // 토큰이 만료됐거나 잘못됐으면(apiFetch가 이미 지움) 로그아웃 상태로 보여 줍니다.
                if (e.status === 401) setToken(null);
                else setError(e.message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [token]);

    // 로그아웃은 서버 API가 없어 토큰만 지웁니다.
    // 로그인 중에 받은 승차권은 로그아웃하면 다룰 수 없어 함께 지우고, 닫으면 이전 화면 대신 처음 화면으로 갑니다.
    const handleLogout = () => {
        clearAuth();
        clearOnboardingTrip();
        setIsLoggedOut(true);
        setToken(null);
        setMe(null);
        setPieces([]);
        setTab('storage');
    };

    const handleTogglePublic = async () => {
        setError('');
        try {
            setMe(await updatePublicSetting(!isPublic));
        } catch (e) {
            setError(e.message);
        }
    };

    const exitPath = isLoggedOut ? '/' : exitTo;

    const goSave = () => navigate('/finish-waiting/save', { state: { from: 'my-sheep' } });

    // 로그인 전 안내 카드 (임시 보관 탭과 로그아웃 상태의 내 담요 탭에서 함께 씁니다)
    const promo = (
        <div className="my-sheep-box my-sheep-box--promo">
            <h3 className="my-sheep-box-title">내 담요 미리보기</h3>
            <div className="my-sheep-promo-circle">
                <img src="/assets/mypage/lock.png" alt="" />
            </div>
            <p className="my-sheep-promo-title">로그인하면 조각이 담요에 이어 붙어요.</p>
            <p className="my-sheep-promo-desc">
                닉네임만 정하면 임시 조각이<br />
                나의 담요로 만들어 집니다.
            </p>
            <button type="button" className="my-sheep-save" onClick={goSave}>계정에 저장</button>
        </div>
    );

    return (
        <main className="my-sheep-page">
            <AppHeader collapseOnDrag showMySheep={false} />
            <button
                type="button"
                className={isMusicMuted ? 'my-sheep-music is-muted' : 'my-sheep-music'}
                aria-label={isMusicMuted ? '배경음악 켜기' : '배경음악 끄기'}
                aria-pressed={!isMusicMuted}
                onClick={toggleMusicMuted}
            >
                <img src="/assets/backgrounds/onboarding/icon-announce.svg" alt="" />
            </button>
            <PanelFrame
                onExit={exitPath ? () => navigate(exitPath) : undefined}
                actions={isBlanket && token && (
                    <button type="button" className="my-sheep-logout" onClick={handleLogout}>
                        <img src="/assets/mypage/logout.png" alt="" />
                        로그아웃
                    </button>
                )}
            >
                <div className="my-sheep-tabs">
                    {TABS.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            className={`my-sheep-tab my-sheep-tab--${tab === key ? 'on' : 'off'}`}
                            aria-pressed={tab === key}
                            onClick={() => setTab(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="my-sheep-content">
                    <h2 className="my-sheep-title">{isBlanket ? (token ? `${me?.nickname ?? ''}님의 담요 · 조각 ${pieces.length}칸` : '내 담요') : '임시 보관'}</h2>
                    <p className="my-sheep-desc">
                        {isBlanket
                            ? '기다림이 끝날 때마다 받은 조각을 모아 나만의 담요를 완성하세요.'
                            : '로그인 전, 이 브라우저에 잠시 보관한 조각이에요.'}
                    </p>
                    {token && isBlanket && isLoading && <p className="my-sheep-desc">불러오는 중이에요...</p>}
                    {token && error && <p className="my-sheep-warn" role="alert">{error}</p>}
                    {isBlanket && !token ? null : isBlanket ? (
                        <>
                            <div className="my-sheep-grid">
                                <div className="my-sheep-box my-sheep-box--side">
                                    <h3 className="my-sheep-box-title">내 담요</h3>
                                    <div className="my-sheep-blanket">
                                        <BlanketArt pieces={pieces} alt="내 담요" getLink={pieceDetailLink} />
                                    </div>
                                </div>
                                <div className="my-sheep-box">
                                    <div className="my-sheep-box-head">
                                        <h3 className="my-sheep-box-title">대기실에 공개</h3>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={isPublic}
                                            aria-label="대기실에 공개"
                                            className={`my-sheep-toggle${isPublic ? ' my-sheep-toggle--on' : ''}`}
                                            onClick={handleTogglePublic}
                                        />
                                    </div>
                                    <p className="my-sheep-box-desc">
                                        공개 설정 시 대기실에서 내 양을 눌렀을 때<br />
                                        담요 카드가 보여요.<br />
                                        기본은 꺼져 있어요.
                                    </p>
                                    <p className="my-sheep-lock">
                                        <img src="/assets/mypage/lock.png" alt="" />
                                        기다림의 결과는 나만 볼 수 있어요.
                                    </p>
                                </div>
                                <div className="my-sheep-box">
                                    <div className="my-sheep-box-head">
                                        <h3 className="my-sheep-box-title">담요 착용</h3>
                                        <span className="my-sheep-badge">준비 중</span>
                                    </div>
                                    <p className="my-sheep-box-desc">내 양에게 담요를 입혀주는 기능을 준비하고 있어요.</p>
                                    <button type="button" className="my-sheep-btn">내 담요 보기</button>
                                </div>
                            </div>
                            <p className="my-sheep-notice">
                                <span className="my-sheep-notice-icon" aria-hidden="true">!</span>
                                로그아웃 시 로그인만 해제되고 서버에 저장된 조각은 유지돼요. 로그아웃 후 임시 보관 탭으로 전환됩니다.
                            </p>
                        </>
                    ) : (
                        <div className="my-sheep-grid my-sheep-grid--storage">
                            <div className="my-sheep-box">
                                <h3 className="my-sheep-box-title">임시 조각함</h3>
                                <div className="my-sheep-slots">
                                    {Array.from({ length: 6 }, (_, i) => {
                                        const piece = tempPieces[i];

                                        return piece ? (
                                            <Link key={piece.id} to={`/my-sheep/piece/${piece.id}?from=storage`} className="my-sheep-slot my-sheep-slot--filled" aria-label={`${piece.name} 조각 보기`}>
                                                {piece.image && <img src={piece.image} alt="" />}
                                            </Link>
                                        ) : (
                                            <div key={i} className="my-sheep-slot">+</div>
                                        );
                                    })}
                                </div>
                                <p className="my-sheep-warn">
                                    <span className="my-sheep-warn-icon" aria-hidden="true">!</span>
                                    브라우저를 지우면 사라질 수 있어요
                                </p>
                            </div>
                            {token ? (
                                <div className="my-sheep-box">
                                    <h3 className="my-sheep-box-title">내 담요 미리보기</h3>
                                    <div className="my-sheep-blanket">
                                        {/* 임시 조각함에 담긴 조각만 보여 준다 */}
                                        <BlanketArt pieces={tempPieces} alt="내 담요 미리보기" getLink={pieceDetailLink} />
                                    </div>
                                </div>
                            ) : promo}
                        </div>
                    )}
                </div>
                {isBlanket && !token && <p className="my-sheep-login-msg">로그인 후 이용할 수 있습니다.</p>}
            </PanelFrame>
        </main>
    );
}
