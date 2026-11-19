import { useEffect, useRef, useState } from 'react';

import { REACTION_FEEDBACK_MS, REACTION_VISIBLE_MS } from '../../data/waitingRoomBroadcast';
import { EventBus } from '../../game/EventBus';
import { WAITING_ROOM_REACTION_EVENT } from '../../game/waitingRoomReactionEvents';

export default function WaitingRoomReactionBubble ({
    anchor,
    broadcasterTicketNumber,
    reactingTicketId,
    isVisible,
    onDismiss
})
{
    const [activeReaction, setActiveReaction] = useState(null);
    const dismissTimerRef = useRef(null);
    const autoCloseTimerRef = useRef(null);

    const clearTimers = () =>
    {
        if (dismissTimerRef.current)
        {
            clearTimeout(dismissTimerRef.current);
            dismissTimerRef.current = null;
        }

        if (autoCloseTimerRef.current)
        {
            clearTimeout(autoCloseTimerRef.current);
            autoCloseTimerRef.current = null;
        }
    };

    useEffect(() =>
    {
        if (!isVisible)
        {
            setActiveReaction(null);
            clearTimers();
            return;
        }

        autoCloseTimerRef.current = setTimeout(() =>
        {
            onDismiss?.();
        }, REACTION_VISIBLE_MS);

        return () =>
        {
            clearTimers();
        };
    }, [isVisible, onDismiss]);

    const handleReaction = (reactionId) =>
    {
        if (activeReaction)
        {
            return;
        }

        setActiveReaction(reactionId);
        clearTimers();
        EventBus.emit(WAITING_ROOM_REACTION_EVENT, {
            reactionType: reactionId,
            ticketId: reactingTicketId ?? null
        });

        dismissTimerRef.current = setTimeout(() =>
        {
            setActiveReaction(null);
            onDismiss?.();
        }, REACTION_FEEDBACK_MS);
    };

    if (!isVisible)
    {
        return null;
    }

    const numberLabel = typeof broadcasterTicketNumber === 'number' ? broadcasterTicketNumber : '—';

    return (
        <div className="waiting-room-reaction-layer" role="presentation">
            <button
                type="button"
                className="waiting-room-reaction-backdrop"
                aria-label="리액션 닫기"
                onClick={() => onDismiss?.()}
            />
            <section
                className={anchor ? 'waiting-room-reaction is-anchored' : 'waiting-room-reaction'}
                aria-label="방송 리액션"
                style={anchor ? { left: anchor.x, top: anchor.y } : undefined}
            >
                <div
                    className="waiting-room-reaction-bubble"
                    role="group"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="waiting-room-reaction-bubble-content">
                        <p>{numberLabel}번 양님에게 마음을 전해볼까요?</p>
                        <div className="waiting-room-reaction-buttons">
                            <button
                                type="button"
                                className={
                                    activeReaction === 'nod'
                                        ? 'waiting-room-reaction-btn waiting-room-reaction-btn-nod is-active'
                                        : 'waiting-room-reaction-btn waiting-room-reaction-btn-nod'
                                }
                                disabled={Boolean(activeReaction)}
                                onClick={() => handleReaction('nod')}
                            >
                                <img
                                    className="waiting-room-reaction-btn-icon"
                                    src="/assets/ui/waiting-room/reaction-btn-nod.png"
                                    alt=""
                                />
                                끄덕끄덕
                            </button>
                            <span className="waiting-room-reaction-divider" aria-hidden="true" />
                            <button
                                type="button"
                                className={
                                    activeReaction === 'send'
                                        ? 'waiting-room-reaction-btn waiting-room-reaction-btn-send is-active'
                                        : 'waiting-room-reaction-btn waiting-room-reaction-btn-send'
                                }
                                disabled={Boolean(activeReaction)}
                                onClick={() => handleReaction('send')}
                            >
                                <img
                                    className="waiting-room-reaction-btn-icon"
                                    src="/assets/ui/waiting-room/reaction-btn-heart.png"
                                    alt=""
                                />
                                전해요
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}