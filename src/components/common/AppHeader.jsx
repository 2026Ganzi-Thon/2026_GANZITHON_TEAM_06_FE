import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// shortcut: 발표 전에 공공 상담 번호가 최신인지 확인, SF-01
const SAFETY_LINES = [
    { icon: '/assets/help/icon-01.png', title: '자살예방상담전화', call: '109', sub: '24시간 운영 · 통화료 무료', href: 'tel:109' },
    { icon: '/assets/help/icon-02.png', title: '정신건강 위기상담전화', call: '1577-0199', sub: '24시간 운영 · 전문 정신 건강 요원', href: 'tel:15770199' },
    { icon: '/assets/help/icon-03.png', title: '청소년 상담 전화', call: '1388', sub: '청소년 및 보호자 대상 · 24시간 운영', href: 'tel:1388' },
    { icon: '/assets/help/icon-04.png', title: '긴급 상황', call: '112 / 119', sub: '경찰청 긴급신고 / 소방청 119 안전센터', href: 'tel:119' }
];

function SafetyPanel ({ onClose })
{
    useEffect(() =>
    {
        const handleKey = (event) =>
        {
            if (event.key === 'Escape')
            {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div className="safety-panel" role="dialog" aria-modal="true" aria-labelledby="safety-panel-title">
            <button type="button" className="safety-panel-backdrop" aria-label="안전 안내 닫기" onClick={onClose} />
            <section className="safety-panel-card">
                <span className="safety-panel-bar" />
                <h2 id="safety-panel-title">도움이 필요할 때</h2>
                <p>마음이 많이 힘들 때는 언제든 상담을 이용할 수 있어요.</p>
                <ul>
                    {SAFETY_LINES.map((line) => (
                        <li key={line.href}>
                            <img src={line.icon} alt="" />
                            <div className="safety-panel-text">
                                <p className="safety-panel-line">
                                    <strong>{line.title}</strong>
                                    <span className="safety-panel-number">{line.call}</span>
                                </p>
                                <p className="safety-panel-sub">{line.sub}</p>
                            </div>
                            <a className="safety-panel-call" href={line.href}>
                                <img src="/assets/help/call-icon.png" alt="" />
                                <span>전화 하기</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

// 드래그(마우스·터치)·휠 방향이 이 거리(px)를 넘으면 헤더를 접거나 펼친다.
const COLLAPSE_DRAG_PX = 12;

// 위로 드래그/스크롤하면 헤더가 접히고, 아래로 하면 다시 펼쳐진다.
function useCollapseOnDrag (enabled, headerRef)
{
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() =>
    {
        if (!enabled)
        {
            return;
        }

        let startY = null;

        const start = (y) => { startY = y; };
        const move = (y) =>
        {
            if (startY === null)
            {
                return;
            }

            const total = y - startY;

            if (total < -COLLAPSE_DRAG_PX)
            {
                setIsCollapsed(true);
            }
            else if (total > COLLAPSE_DRAG_PX)
            {
                setIsCollapsed(false);
            }
        };
        const end = () => { startY = null; };

        const onMouseDown = (e) => start(e.clientY);
        const onMouseMove = (e) => move(e.clientY);
        const onTouchStart = (e) => start(e.touches[0].clientY);
        const onTouchMove = (e) => move(e.touches[0].clientY);
        const onWheel = (e) => setIsCollapsed((prev) => (e.deltaY > 0 ? true : e.deltaY < 0 ? false : prev));

        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', end);
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', end);
        window.addEventListener('wheel', onWheel, { passive: true });

        return () =>
        {
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', end);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', end);
            window.removeEventListener('wheel', onWheel);
        };
    }, [enabled]);

    // 접힌 만큼 아래 내용이 위로 올라오도록 헤더 높이를 CSS 변수로 알려준다.
    useEffect(() =>
    {
        headerRef.current?.style.setProperty('--app-header-h', `${headerRef.current.offsetHeight}px`);
    }, [isCollapsed, headerRef]);

    return enabled && isCollapsed;
}

export default function AppHeader ({ showMySheep = true, collapseOnDrag = false })
{
    const navigate = useNavigate();
    const headerRef = useRef(null);
    const [isSafetyOpen, setIsSafetyOpen] = useState(false);
    const isCollapsed = useCollapseOnDrag(collapseOnDrag, headerRef);

    return (
        <header ref={headerRef} className={isCollapsed ? 'app-header is-collapsed' : 'app-header'}>
            <img className="app-header-logo" src="/assets/ui/header-logo.png" alt="" />
            <p className="app-header-note">
                <strong>잠시 정차합니다.</strong> | 답장은 안 와도, 대기실엔 누군가 함께 있습니다.
            </p>
            <div className="app-header-actions">
                {showMySheep && (
                    <button type="button" aria-label="마이 양" onClick={() => navigate('/my-sheep')}>
                        <img src="/assets/ui/btn-my-sheep.png" alt="" />
                    </button>
                )}
                <button type="button" aria-label="안전 안내" onClick={() => setIsSafetyOpen(true)}>
                    <img src="/assets/ui/btn-safety.png" alt="" />
                </button>
            </div>
            {isSafetyOpen && <SafetyPanel onClose={() => setIsSafetyOpen(false)} />}
        </header>
    );
}
