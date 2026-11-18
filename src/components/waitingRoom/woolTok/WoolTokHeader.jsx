// 패널 맨 위: 제목/설명(왼쪽), 털실 개수 + 닫기 버튼(오른쪽).
export default function WoolTokHeader ({ woolCount, onClose })
{
    return (
        <div className="wool-panel-header">
            <div className="wool-panel-heading">
                <h2 className="wool-panel-title">털실 톡톡</h2>
                <p className="wool-panel-desc">어디를 눌러도 돼요. 눌러서 한 땀씩 채워 보세요.</p>
            </div>
            <div className="wool-panel-actions">
                <span className="wool-panel-count">
                    <img src="/assets/wool/wool-count.png" alt="" />
                    <span className="wool-panel-count-text">털실 {woolCount}올</span>
                </span>
                <button type="button" className="wool-panel-exit" aria-label="닫기" onClick={onClose}>
                    X
                </button>
            </div>
        </div>
    );
}
