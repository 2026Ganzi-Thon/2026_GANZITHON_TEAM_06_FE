import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// shortcut: 발표 전에 공공 상담 번호가 최신인지 확인, SF-01
const SAFETY_LINES = [
    { name: '자살예방상담전화', number: '109', href: 'tel:109' },
    { name: '정신건강위기상담전화', number: '1577-0199', href: 'tel:15770199' },
    { name: '청소년상담전화', number: '1388', href: 'tel:1388' }
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
                <h2 id="safety-panel-title">안전 안내</h2>
                <p>기다림과 상관없이, 이야기하고 싶을 때 연결할 수 있는 공공 상담전화입니다.</p>
                <ul>
                    {SAFETY_LINES.map((line) => (
                        <li key={line.href}>
                            <a href={line.href}>{line.name} {line.number}</a>
                        </li>
                    ))}
                </ul>
                <button type="button" className="safety-panel-close" onClick={onClose}>닫기</button>
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
