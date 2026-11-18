// 조각 뒷면(기록 층)에 적히는 종료 표식 문구입니다.
const ENDING_LABELS = {
    ANSWERED: '답이 옴',
    UNEXPECTED: '기대와 달랐음',
    LET_GO: '내려놓음',
};

// 모든 조각이 같은 뒷면을 씁니다.
export const PIECE_BACK_IMAGE = '/assets/blanket/b-back.png';

// 도안 코드 → 이미지 파일명 접두. 백엔드 확정 코드 9개이고, 파일명은 산(moutine) 철자가 다르다.
export const PATTERN_IMAGE_NAMES = {
    PATTERN_HEART: 'heart',
    PATTERN_CLOUD: 'cloud',
    PATTERN_STAR: 'star',
    PATTERN_MOUNTAIN: 'moutine',
    PATTERN_SPROUT: 'leaf',
    PATTERN_FOREST: 'tree',
    PATTERN_TRAIN: 'train',
    PATTERN_MOON: 'moon',
    PATTERN_FLOWER: 'flower',
};

// 담요 조각(앞면) 이미지. 모르는 코드는 null이라 이미지를 그리지 않습니다.
function patternImage (patternCode)
{
    const name = PATTERN_IMAGE_NAMES[patternCode];

    return name ? `/assets/blanket/b-${name}.png` : null;
}

// 뒷면 기록 값. 서버 조각 상세/종료 응답 모두 같은 필드를 씁니다.
export function toRecord (data)
{
    return {
        room: data.waitingName,
        trains: `${data.trainCount}대`,
        ending: ENDING_LABELS[data.endReason] || '',
    };
}

// 서버 조각(목록 항목/종료 응답)을 화면용 조각으로 바꿉니다. id는 주소에 쓰는 문자열입니다.
export function toPiece (data, index)
{
    return {
        id: String(data.blanketPieceId ?? data.ticketId),
        image: patternImage(data.patternCode),
        name: `${index + 1}번째`,
        // 임시 조각은 종료 응답에 뒷면 값이 다 있습니다. 서버 목록 항목에는 없어 상세를 따로 불러옵니다.
        record: data.waitingName ? toRecord(data) : null,
    };
}
