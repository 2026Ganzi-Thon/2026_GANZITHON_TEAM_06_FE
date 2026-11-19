// 번호 + 제목/설명이 있는 선택 버튼 (기다림 마치기의 선택지, 온보딩의 대기실 선택이 함께 씁니다).
// hidden: 자리는 남기고 버튼만 감춤, badge: 오른쪽에 붙는 짧은 글자 (대기실 인원 등)
export default function ChoiceButton ({ index, title, subtitle, badge, selected, hidden = false, onClick })
{
    return (
        <button
            type="button"
            className={`finish-waiting-btn${selected ? ' is-selected' : ''}${hidden ? ' is-hidden' : ''}`}
            aria-pressed={selected}
            onClick={onClick}
        >
            <span className="finish-waiting-num">{index}</span>
            <span className="finish-waiting-text">
                <strong>{title}</strong>
                <span>{subtitle}</span>
            </span>
            {badge && <span className="finish-waiting-badge">{badge}</span>}
            {/* 배지가 있으면 선택 전에도 체크 자리를 비워 두어, 선택할 때 배지가 옆으로 밀리지 않게 한다 */}
            {(selected || badge) && (
                <span className={`finish-waiting-check${selected ? '' : ' is-empty'}`}>
                    {selected && <img src="/assets/finish-waiting/check.png" alt="선택됨" />}
                </span>
            )}
        </button>
    );
}
