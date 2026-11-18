function formatStat (value)
{
    if (typeof value !== 'number')
    {
        return '—';
    }

    return `${value}건`;
}

export default function WaitingRoomMarquee ({
    arrivalCount,
    releasedCount,
    phase = 'idle',
    broadcastMessage = ''
})
{
    const isBroadcasting = phase === 'broadcasting';
    const showDefaultMessage = phase !== 'broadcasting';

    return (
        <section className="waiting-room-marquee" aria-label="안내 전광판">
            <img
                className="waiting-room-marquee-frame"
                src="/assets/ui/waiting-room/marquee-board.png"
                alt=""
                aria-hidden="true"
            />
            <div className="waiting-room-marquee-body">
                <div className="waiting-room-marquee-message-wrap">
                    <span className="waiting-room-marquee-train-icon" aria-hidden="true" />
                    {showDefaultMessage ? (
                        <p className="waiting-room-marquee-message">
                            열차는 30분에 한 번 지나가요.
                            <br />
                            도착 시간은 알 수 없어요.
                        </p>
                    ) : (
                        <p className="waiting-room-marquee-message waiting-room-marquee-message-broadcast">
                            {broadcastMessage}
                        </p>
                    )}
                </div>
                <div className="waiting-room-marquee-stats">
                    <p>
                        <span className="waiting-room-marquee-stats-label">도착</span>
                        <span className="waiting-room-marquee-stats-value">{formatStat(arrivalCount)}</span>
                    </p>
                    <p>
                        <span className="waiting-room-marquee-stats-label">내려놓음</span>
                        <span className="waiting-room-marquee-stats-value">{formatStat(releasedCount)}</span>
                    </p>
                </div>
            </div>
            {isBroadcasting && (
                <p className="waiting-room-marquee-live">
                    <span>안내방송 중</span>
                    <span className="waiting-room-marquee-live-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </span>
                </p>
            )}
        </section>
    );
}