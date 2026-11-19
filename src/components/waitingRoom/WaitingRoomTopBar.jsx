export default function WaitingRoomTopBar ({ roomName, roomSubtitle, waitingCount, standingCount = 0 })
{
    const displayName = roomName || '대기실';
    const subtitle = roomSubtitle || '기다림을 나누는 자리';
    const waitingLabel = typeof waitingCount === 'number' ? `${waitingCount}명` : '—';

    return (
        <section className="waiting-room-top" aria-label="대기실 정보">
            <img
                className="waiting-room-top-frame"
                src="/assets/ui/waiting-room/top-bar.png"
                alt=""
                aria-hidden="true"
            />
            <div className="waiting-room-top-copy">
                <h1>{displayName}</h1>
                <p>{subtitle}</p>
            </div>
            <p className="waiting-room-top-waiting">
                <span className="waiting-room-top-waiting-label">현재 대기</span>
                <span className="waiting-room-top-waiting-value">{waitingLabel}</span>
            </p>
            {standingCount > 0 && <p className="waiting-room-top-standing">입석 +{standingCount}명</p>}
        </section>
    );
}