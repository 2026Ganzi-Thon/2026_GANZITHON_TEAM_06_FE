import { useEffect, useMemo, useRef, useState } from 'react';

import { PATTERN_IMAGE_NAMES } from '../../../data/pieces';
import { WOOL_PATTERNS } from '../../../data/woolPatterns';

// 매번 새로 불러오면 소리가 늦게 나므로 한 번만 미리 불러온다.
const WOOL_SOUND = new Audio('/assets/sounds/wool.mp3');
WOOL_SOUND.preload = 'auto';

// 도안 코드(PATTERN_HEART)에 맞는 칸 목록. color는 그 칸을 채우는 실 이미지 번호입니다.
function buildCells (name)
{
    return (WOOL_PATTERNS[name] ?? []).flatMap((row, r) => [...row].map((color, c) => ({ id: r * 8 + c, row: r, col: c, color })));
}

// 도안 위의 칸을 누르면 그 칸이 실 이미지로 채워진다.
export default function WoolTokPattern ({ patternCode, flip, onCompleteChange })
{
    const name = PATTERN_IMAGE_NAMES[patternCode];
    const cells = useMemo(() => buildCells(name), [name]);
    const [filled, setFilled] = useState(() => new Set());

    // 한 획: 마지막으로 채운 칸에서 위/아래/왼쪽/오른쪽으로 이웃한 같은 색 빈 칸만 이어서 채운다. null이면 드래그 중이 아님.
    const lastCell = useRef(null);

    const isComplete = cells.length > 0 && filled.size === cells.length;

    // 다 채웠는지 부모(전달 버튼 활성화)에 알린다.
    useEffect(() => onCompleteChange?.(isComplete), [isComplete, onCompleteChange]);

    // 도안을 완성하는 순간 종소리를 한 번 낸다.
    useEffect(() =>
    {
        if (isComplete)
        {
            const bell = new Audio('/assets/sounds/bell-short.mp3');

            bell.volume = 0.5;
            bell.play().catch(() => {});
        }
    }, [isComplete]);

    const handleFill = (id) =>
    {
        if (filled.has(id))
        {
            return;
        }

        // 미리 불러둔 소리를 복제해 재생해 겹쳐 들리게 한다. 자동재생 차단 등으로 실패해도 무시한다.
        WOOL_SOUND.cloneNode().play().catch(() => {});
        setFilled((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    };

    // 포인터 아래의 칸을 찾는다. 캡처 중에는 target이 고정되므로 좌표로 찾는다.
    const cellAt = (event) =>
    {
        const el = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-cell-id]');

        return el ? cells[Number(el.dataset.cellId)] : null;
    };

    const handlePointerDown = (event) =>
    {
        const cell = cellAt(event);

        if (cell && !filled.has(cell.id))
        {
            // 칸 밖으로 나가도 move 이벤트가 grid로 계속 오게 한다.
            event.currentTarget.setPointerCapture(event.pointerId);
            lastCell.current = cell;
            handleFill(cell.id);
        }
    };

    const handlePointerMove = (event) =>
    {
        const last = lastCell.current;
        const cell = last ? cellAt(event) : null;

        if (!cell || filled.has(cell.id) || cell.color !== last.color)
        {
            return;
        }

        // 대각선·건너뛰기는 무시한다. 이웃한 칸을 거쳐 가야 이어진다.
        if (Math.abs(cell.row - last.row) + Math.abs(cell.col - last.col) === 1)
        {
            lastCell.current = cell;
            handleFill(cell.id);
        }
    };

    const stopDrawing = () =>
    {
        lastCell.current = null;
    };

    if (!cells.length)
    {
        return null;
    }

    return (
        <div className={`wool-pattern${isComplete ? ' is-complete' : ''}${flip ? ` is-flip-${flip}` : ''}`}>
            <img className="wool-pattern-bg" src={`/assets/blanket/d-${name}.png`} alt="도안" draggable={false} />
            <div
                className="wool-pattern-grid"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
            >
                {cells.map((cell) => (
                    <button
                        key={cell.id}
                        data-cell-id={cell.id}
                        style={{ '--wave-order': cell.row + cell.col }}
                        type="button"
                        className="wool-pattern-cell"
                        aria-label={`${cell.row + 1}행 ${cell.col + 1}열 채우기`}
                        onClick={() => handleFill(cell.id)}
                    >
                        {filled.has(cell.id) && (
                            <img src={`/assets/blanket/c-${name}-${cell.color}.png`} alt="" draggable={false} />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
