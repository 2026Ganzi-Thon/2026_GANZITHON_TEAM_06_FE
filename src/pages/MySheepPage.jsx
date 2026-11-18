import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import AppHeader from '../components/common/AppHeader';
import PanelFrame from '../components/common/PanelFrame';
import { PIECES } from '../data/pieces';

const TABS = [
    { key: 'blanket', label: '내 담요' },
    { key: 'storage', label: '임시 보관' },
];

// blanket-panel.svg(390 x 416.441) 안 3 x 3 칸의 위치. 칸 크기는 97.2639 x 96.3196 입니다.
const BLANKET_W = 390;
const BLANKET_H = 416.441;
const CELL_COLS = [33, 141, 249];
const CELL_ROWS = [50, 160, 270];
const CELL_W = 97.2639;
const CELL_H = 96.3196;

export default function MySheepPage()
{
    // 탭을 주소(?tab=)에 두어, 조각 상세에서 뒤로 돌아와도 보던 탭이 유지됩니다.
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') === 'storage' ? 'storage' : 'blanket';
    const setTab = (key) => setSearchParams({ tab: key }, { replace: true });
    const [isPublic, setIsPublic] = useState(false);
    const isBlanket = tab === 'blanket';

    return (
        <main className="my-sheep-page">
            <AppHeader collapseOnDrag showMySheep={false} />
            <PanelFrame
                actions={isBlanket && (
                    <button type="button" className="my-sheep-logout" onClick={() => setTab('storage')}>
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
                    <h2 className="my-sheep-title">{isBlanket ? '몽실님의 담요 · 조각 5칸' : '임시 보관'}</h2>
                    <p className="my-sheep-desc">
                        {isBlanket
                            ? '기다림이 끝날 때마다 받은 조각을 모아 나만의 담요를 완성하세요.'
                            : '로그인 전, 이 브라우저에 잠시 보관한 조각이에요.'}
                    </p>
                    {isBlanket ? (
                        <>
                            <div className="my-sheep-grid">
                                <div className="my-sheep-box my-sheep-box--side">
                                    <h3 className="my-sheep-box-title">내 담요</h3>
                                    <div className="my-sheep-blanket">
                                        <div className="my-sheep-blanket__art">
                                            <img src="/assets/mypage/blanket-panel.svg" alt="내 담요" />
                                            {PIECES.slice(0, CELL_COLS.length * CELL_ROWS.length).map((piece, i) => (
                                                <Link
                                                    key={piece.id}
                                                    to={`/my-sheep/piece/${piece.id}`}
                                                    className="my-sheep-blanket__cell"
                                                    aria-label={`${piece.name} 조각 보기`}
                                                    style={{
                                                        left: `${(CELL_COLS[i % CELL_COLS.length] / BLANKET_W) * 100}%`,
                                                        top: `${(CELL_ROWS[Math.floor(i / CELL_COLS.length)] / BLANKET_H) * 100}%`,
                                                        width: `${(CELL_W / BLANKET_W) * 100}%`,
                                                        height: `${(CELL_H / BLANKET_H) * 100}%`,
                                                    }}
                                                >
                                                    <img src={piece.image} alt="" />
                                                </Link>
                                            ))}
                                        </div>
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
                                            onClick={() => setIsPublic((prev) => !prev)}
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
                                        const piece = PIECES[i];

                                        return piece ? (
                                            <Link key={piece.id} to={`/my-sheep/piece/${piece.id}?from=storage`} className="my-sheep-slot my-sheep-slot--filled" aria-label={`${piece.name} 조각 보기`}>
                                                <img src={piece.image} alt="" />
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
                                <button type="button" className="my-sheep-save">계정에 저장</button>
                            </div>
                        </div>
                    )}
                </div>
            </PanelFrame>
        </main>
    );
}
