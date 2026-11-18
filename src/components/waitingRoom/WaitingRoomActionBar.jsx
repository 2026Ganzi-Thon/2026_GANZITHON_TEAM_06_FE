export default function WaitingRoomActionBar ({
    passedTrains,
    onEndWaiting,
    onOpenBroadcast,
    broadcastDisabled = false,
    broadcastCooldownLeft = null
})
{
    const hasCount = typeof passedTrains === 'number';
    const isCoolingDown = broadcastCooldownLeft !== null;

    return (
        <section className="waiting-room-actions" aria-label="대기실 액션">
            <p className="waiting-room-train-pill">
                {/* 아이콘만 있는 배경 이미지. 글자는 아이콘 오른쪽에 직접 그린다. */}
                <img
                    className="waiting-room-train-pill-bg"
                    src="/assets/ui/waiting-room/train-passed-bar-sm.png"
                    alt=""
                    aria-hidden="true"
                />
                <span className="waiting-room-train-pill-text">지나간 열차 {hasCount ? passedTrains : '—'}대</span>
            </p>
            <div className="waiting-room-action-buttons">
                <button
                    type="button"
                    className="waiting-room-broadcast"
                    disabled={broadcastDisabled}
                    aria-disabled={broadcastDisabled}
                    onClick={onOpenBroadcast}
                >
                    <img
                        className={isCoolingDown ? 'is-off' : undefined}
                        src={isCoolingDown ? '/assets/ui/waiting-room/btn-broadcast-off.png' : '/assets/ui/waiting-room/btn-broadcast.png'}
                        alt=""
                    />
                    {isCoolingDown
                        ? <span className="waiting-room-broadcast-cooldown">다음 방송까지 {broadcastCooldownLeft}초</span>
                        : <span className="visually-hidden">안내방송 작성</span>}
                </button>
                <button type="button" className="waiting-room-end" onClick={onEndWaiting}>
                    <img src="/assets/ui/waiting-room/btn-end-waiting.png" alt="" />
                    <span className="visually-hidden">기다림 마치기</span>
                </button>
            </div>
        </section>
    );
}