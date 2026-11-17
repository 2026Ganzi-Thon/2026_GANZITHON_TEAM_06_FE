export default function WaitingRoomActionBar ({ passedTrains, onEndWaiting })
{
    const hasCount = typeof passedTrains === 'number';
    const countLabel = hasCount ? `${passedTrains}대` : '—';

    return (
        <section className="waiting-room-actions" aria-label="대기실 액션">
            <p className="waiting-room-train-pill">
                <img
                    className="waiting-room-train-pill-bg"
                    src="/assets/ui/waiting-room/train-passed-bar.png"
                    alt=""
                    aria-hidden="true"
                />
                {/* 숫자만 — 「대」는 train-passed-bar.png에 포함 */}
                <span className="waiting-room-train-pill-value" aria-label={hasCount ? `지나간 열차 ${countLabel}` : undefined}>
                    {hasCount ? passedTrains : '—'}
                </span>
            </p>
            <div className="waiting-room-action-buttons">
                <button type="button" className="waiting-room-broadcast" disabled aria-disabled="true">
                    <img src="/assets/ui/waiting-room/btn-broadcast.png" alt="" />
                    <span className="visually-hidden">안내방송 작성</span>
                </button>
                <button type="button" className="waiting-room-end" onClick={onEndWaiting}>
                    <img src="/assets/ui/waiting-room/btn-end-waiting.png" alt="" />
                    <span className="visually-hidden">기다림 마치기</span>
                </button>
            </div>
        </section>
    );
}