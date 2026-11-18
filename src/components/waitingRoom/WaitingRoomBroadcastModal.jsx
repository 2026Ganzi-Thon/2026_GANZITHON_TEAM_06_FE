import { useCallback, useEffect, useMemo, useState } from 'react';

import { MOOD_CHIPS } from '../../game/onboardingSession';
import { fetchSituationChips } from '../../services/situationChips';
import { buildBroadcastMessage } from '../../utils/buildBroadcastMessage';

function BroadcastPreview ({ ticketNumber, situationLabel, moodLabel })
{
    const numberLabel = typeof ticketNumber === 'number' ? ticketNumber : '—';

    return (
        <p className="waiting-room-broadcast-preview">
            안내 말씀 드립니다. {numberLabel}번 <mark className="waiting-room-broadcast-highlight">{moodLabel || '상태'}</mark> 양님이{'\n'}
            <mark className="waiting-room-broadcast-highlight">{situationLabel || '상황'}</mark>입니다.
        </p>
    );
}

// 선택 버튼. 이미지(off/on)가 배경이고 글자는 위에 올린다.
function ChipButton ({ kind, label, selected, onClick })
{
    return (
        <button
            type="button"
            className={`waiting-room-broadcast-chip waiting-room-broadcast-chip-${kind}`}
            style={{ backgroundImage: `url(/assets/ui/waiting-room/${kind}-btn-${selected ? 'on' : 'off'}.png)` }}
            aria-pressed={selected}
            onClick={onClick}
        >
            {label}
            {selected && (
                <span className="waiting-room-broadcast-check">
                    <img src="/assets/finish-waiting/check.png" alt="" />
                </span>
            )}
        </button>
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
                    <img src="/assets/ui/waiting-room/lamp.png" alt="" />
                    <div>
                        <h2 id="waiting-room-broadcast-title">안내방송 작성</h2>
                        <p>방송은 전광판에 15초 동안 나와요.</p>
                    </div>
                </header>

                <div className="waiting-room-broadcast-box waiting-room-broadcast-preview-box" aria-live="polite">
                    <BroadcastPreview
                        ticketNumber={trip?.ticketNumber}
                        situationLabel={selectedSituationLabel}
                        moodLabel={selectedMoodLabel}
                    />
                </div>

                <div className="waiting-room-broadcast-box waiting-room-broadcast-state-box">
                    {chipsLoading && <p className="waiting-room-broadcast-status">상황 칩을 불러오는 중이에요.</p>}
                    {chipsError && (
                        <div className="waiting-room-broadcast-status waiting-room-broadcast-status-error">
                            <p>{chipsError}</p>
                            <button type="button" className="waiting-room-broadcast-retry" onClick={loadChips}>
                                다시 시도
                            </button>
                        </div>
                    )}
                    {!chipsLoading && !chipsError && situationChips.map((chip) => (
                        <ChipButton
                            key={chip.situationChipCode}
                            kind="state"
                            label={chip.label}
                            selected={chip.situationChipCode === selectedSituationCode}
                            onClick={() => setSelectedSituationCode(chip.situationChipCode)}
                        />
                    ))}
                </div>

                <div className="waiting-room-broadcast-box waiting-room-broadcast-emotion-box">
                    {MOOD_CHIPS.map((chip) => (
                        <ChipButton
                            key={chip.id}
                            kind="emotion"
                            label={chip.label}
                            selected={chip.id === selectedMood}
                            onClick={() => setSelectedMood(chip.id)}
                        />
                    ))}
                </div>

                <button type="button" className="waiting-room-broadcast-cancel" onClick={onClose}>
                    취소
                </button>
                <button
                    type="button"
                    className="waiting-room-broadcast-send"
                    disabled={!canSend}
                    onClick={handleSend}
                >
                    <img src="/assets/ui/waiting-room/announce-icon.png" alt="" />
                    안내 방송 보내기
                </button>
            </section>
        </div>
    );
}