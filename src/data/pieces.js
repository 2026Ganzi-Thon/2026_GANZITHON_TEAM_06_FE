// 조각 뒷면(기록 층)에 적히는 값입니다. 조각마다 다른 값은 API가 생기면 채웁니다.
const DEFAULT_RECORD = { room: '읽씹 방', trains: '3대', ending: '답이 옴' };

// 임시 조각함에 보관된 조각 목록입니다. API가 생기면 이 자리를 교체합니다.
export const PIECES = [
    { id: 'heart', image: '/assets/blanket/b-heart.png', name: '하트', record: DEFAULT_RECORD },
    { id: 'star', image: '/assets/blanket/b-star.png', name: '별', record: DEFAULT_RECORD },
];

// 모든 조각이 같은 뒷면을 씁니다.
export const PIECE_BACK_IMAGE = '/assets/blanket/b-back.png';
