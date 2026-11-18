import { MOOD_CHIPS } from '../game/onboardingSession.js';

function resolveMoodLabel (moodChipId)
{
    const chip = MOOD_CHIPS.find((item) => item.id === moodChipId);

    return chip?.label ?? '양';
}

export function buildBroadcastMessage ({ ticketNumber, moodChip, situationLabel })
{
    const numberLabel = typeof ticketNumber === 'number' ? ticketNumber : '—';
    const moodLabel = resolveMoodLabel(moodChip);
    const situation = situationLabel?.trim() || '…';

    return `안내 말씀 드립니다. ${numberLabel}번 ${moodLabel} 양님이 ${situation}입니다.`;
}