import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HEADER_NOTE = '잠시 정차합니다. | 답장은 안 와도, 대기실엔 누군가 함께 있습니다.';

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

export default function AppHeader ({ showMySheep = true })
{
    const navigate = useNavigate();
    const [isSafetyOpen, setIsSafetyOpen] = useState(false);

    return (
        <header className="app-header">
            <img className="app-header-logo" src="/assets/ui/header-logo.png" alt="" />
            <p className="app-header-note">{HEADER_NOTE}</p>
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
