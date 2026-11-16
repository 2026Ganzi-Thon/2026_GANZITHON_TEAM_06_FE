import { useNavigate } from 'react-router-dom';

// 마이 양 계열 화면이 함께 쓰는 panel + 닫기(X) 버튼 틀입니다.
// actions: 닫기 버튼 왼쪽에 놓을 버튼들, onExit: 닫기 동작 재정의, fallbackTo: 돌아갈 기록이 없을 때 이동할 곳, children: 패널 안의 내용
export default function PanelFrame({ actions, onExit, fallbackTo = '/', children })
{
    const navigate = useNavigate();

    // 기본은 이전 화면으로. 주소로 바로 들어와 돌아갈 기록이 없으면 fallbackTo 로 이동합니다.
    const handleBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallbackTo));
    const handleExit = onExit ?? handleBack;

    return (
        <div className="my-sheep-panel">
            <img src="/assets/common/panel.png" alt="" />
            <div className="my-sheep-actions">
                {actions}
                <button type="button" className="my-sheep-exit" aria-label="닫기" onClick={handleExit}>X</button>
            </div>
            {children}
        </div>
    );
}
