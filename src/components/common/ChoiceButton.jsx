// 번호 + 제목/설명이 있는 선택 버튼 (기다림 마치기의 선택지, 온보딩의 대기실 선택이 함께 씁니다).
// hidden: 자리는 남기고 버튼만 감춤
export default function ChoiceButton ({ index, title, subtitle, selected, hidden = false, onClick })
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
            {selected && (
                <span className="finish-waiting-check">
                    <img src="/assets/finish-waiting/check.png" alt="선택됨" />
                </span>
            )}
        </button>
    );
}
