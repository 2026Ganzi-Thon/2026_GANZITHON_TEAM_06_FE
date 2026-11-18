import { useCallback, useEffect, useMemo, useState } from 'react';

import { MOOD_CHIPS } from '../../game/onboardingSession';
import { fetchSituationChips } from '../../services/situationChips';
import { buildBroadcastMessage } from '../../utils/buildBroadcastMessage';

function BroadcastPreview ({ ticketNumber, situationLabel, moodLabel, hasMoodSelection, hasSituationSelection })
{
    const numberLabel = typeof ticketNumber === 'number' ? ticketNumber : '—';

    return (
        <p className="waiting-room-broadcast-preview">
            안내 말씀 드립니다. {numberLabel}번{' '}
            {hasMoodSelection ? (
                <mark className="waiting-room-broadcast-highlight">{moodLabel}</mark>
            ) : (
                <span className="waiting-room-broadcast-placeholder">상태</span>
            )}{' '}
            양님이{' '}
            {hasSituationSelection ? (
                <mark className="waiting-room-broadcast-highlight">{situationLabel}</mark>
            ) : (
                <span className="waiting-room-broadcast-placeholder">상황</span>
            )}
            입니다.
        </p>
    );
}

export default function WaitingRoomBroadcastModal ({
    isOpen,
    roomCode,
    trip,
    onClose,
    onSend
})
{
    const [situationChips, setSituationChips] = useState([]);
    const [chipsLoading, setChipsLoading] = useState(false);
    const [chipsError, setChipsError] = useState(null);
    const [selectedSituationCode, setSelectedSituationCode] = useState(null);
    const [selectedMood, setSelectedMood] = useState(trip?.moodChip ?? null);

    const selectedSituationLabel = useMemo(() =>
    {
        const chip = situationChips.find((item) => item.situationChipCode === selectedSituationCode);

        return chip?.label ?? '';
    }, [situationChips, selectedSituationCode]);

    const selectedMoodLabel = useMemo(() =>
    {
        const chip = MOOD_CHIPS.find((item) => item.id === selectedMood);

        return chip?.label ?? '';
    }, [selectedMood]);

    const loadChips = useCallback(async () =>
    {
        if (!roomCode)
        {
            setChipsError('대기실 정보를 찾지 못했어요.');
            return;
        }

        setChipsLoading(true);
        setChipsError(null);

        try
        {
            const chips = await fetchSituationChips(roomCode);

            setSituationChips(chips);
        }
        catch (error)
        {
            setChipsError(error.message);
            setSituationChips([]);
        }
        finally
        {
            setChipsLoading(false);
        }
    }, [roomCode]);

    useEffect(() =>
    {
        if (!isOpen)
        {
            return;
        }

        setSelectedMood(trip?.moodChip ?? null);
        setSelectedSituationCode(null);
        loadChips();
    }, [isOpen, loadChips, trip?.moodChip]);

    const canSend = Boolean(selectedSituationCode && selectedMood);

    const handleSend = () =>
    {
        if (!canSend)
        {
            return;
        }

        onSend({
            situationChipCode: selectedSituationCode,
            moodChip: selectedMood,
            message: buildBroadcastMessage({
                ticketNumber: trip?.ticketNumber,
                moodChip: selectedMood,
                situationLabel: selectedSituationLabel
            })
        });
    };

    if (!isOpen)
    {
        return null;
    }

    return (
        <div className="waiting-room-broadcast-modal" role="presentation">
            <button
                type="button"
                className="waiting-room-broadcast-backdrop"
                aria-label="안내방송 작성 닫기"
                onClick={onClose}
            />
            <section
                className="waiting-room-broadcast-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="waiting-room-broadcast-title"
            >
                <header className="waiting-room-broadcast-header">
                    <h2 id="waiting-room-broadcast-title">안내방송 작성</h2>
                    <p>방송은 전광판에 15초 동안 나와요.</p>
                </header>

                <div className="waiting-room-broadcast-preview-box" aria-live="polite">
                    <BroadcastPreview
                        ticketNumber={trip?.ticketNumber}
                        situationLabel={selectedSituationLabel}
                        moodLabel={selectedMoodLabel}
                        hasMoodSelection={Boolean(selectedMood)}
                        hasSituationSelection={Boolean(selectedSituationCode)}
                    />
                </div>

                {chipsLoading && <p className="waiting-room-broadcast-status">상황 칩을 불러오는 중이에요.</p>}
                {chipsError && (
                    <div className="waiting-room-broadcast-status waiting-room-broadcast-status-error">
                        <p>{chipsError}</p>
                        <button type="button" className="waiting-room-broadcast-retry" onClick={loadChips}>
                            다시 시도
                        </button>
                    </div>
                )}

                {!chipsLoading && !chipsError && (
                    <div className="waiting-room-broadcast-chips">
                        <div className="waiting-room-broadcast-chips-column">
                            <h3>상황</h3>
                            <ul className="waiting-room-broadcast-chip-list">
                                {situationChips.map((chip) => (
                                    <li key={chip.situationChipCode}>
                                        <button
                                            type="button"
                                            className={
                                                chip.situationChipCode === selectedSituationCode
                                                    ? 'waiting-room-broadcast-chip is-selected'
                                                    : 'waiting-room-broadcast-chip'
                                            }
                                            aria-pressed={chip.situationChipCode === selectedSituationCode}
                                            onClick={() => setSelectedSituationCode(chip.situationChipCode)}
                                        >
                                            {chip.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="waiting-room-broadcast-chips-column">
                            <h3>상태</h3>
                            <ul className="waiting-room-broadcast-chip-grid">
                                {MOOD_CHIPS.map((chip) => (
                                    <li key={chip.id}>
                                        <button
                                            type="button"
                                            className={
                                                chip.id === selectedMood
                                                    ? 'waiting-room-broadcast-chip is-selected'
                                                    : 'waiting-room-broadcast-chip'
                                            }
                                            aria-pressed={chip.id === selectedMood}
                                            onClick={() => setSelectedMood(chip.id)}
                                        >
                                            {chip.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <footer className="waiting-room-broadcast-actions">
                    <button type="button" className="waiting-room-broadcast-cancel" onClick={onClose}>
                        취소
                    </button>
                    <button
                        type="button"
                        className="waiting-room-broadcast-send"
                        disabled={!canSend}
                        onClick={handleSend}
                    >
                        안내 방송 보내기
                    </button>
                </footer>
            </section>
        </div>
    );
}