import { useEffect, useRef, useState } from 'react';

// d-heart.png의 8x8 칸 모양. 1은 하트(c-heart-1), 0은 배경(c-heart-2) 실로 채운다.
const HEART_ROWS = [
    '00000000',
    '01100110',
    '11111111',
    '11111111',
    '11111111',
    '01111110',
    '00111100',
    '00011000'
];
const CELLS = HEART_ROWS.flatMap((row, r) => [...row].map((value, c) => ({ id: r * 8 + c, row: r, col: c, isHeart: value === '1' })));

// 도안 위의 칸을 누르면 그 칸이 실 이미지로 채워진다.
export default function WoolTokPattern ({ onCompleteChange })
{
    const [filled, setFilled] = useState(() => new Set());

    // 한 획: 마지막으로 채운 칸에서 위/아래/왼쪽/오른쪽으로 이웃한 같은 색 빈 칸만 이어서 채운다. null이면 드래그 중이 아님.
    const lastCell = useRef(null);

    const isComplete = filled.size === CELLS.length;

    // 다 채웠는지 부모(전달 버튼 활성화)에 알린다.
    useEffect(() => onCompleteChange?.(isComplete), [isComplete, onCompleteChange]);

    const handleFill = (id) => setFilled((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

    // 포인터 아래의 칸을 찾는다. 캡처 중에는 target이 고정되므로 좌표로 찾는다.
    const cellAt = (event) =>
    {
        const el = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-cell-id]');

        return el ? CELLS[Number(el.dataset.cellId)] : null;
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

        if (!cell || filled.has(cell.id) || cell.isHeart !== last.isHeart)
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

    return (
        <div className={isComplete ? 'wool-pattern is-complete' : 'wool-pattern'}>
            <img className="wool-pattern-bg" src="/assets/blanket/d-heart.png" alt="도안" draggable={false} />
            <div
                className="wool-pattern-grid"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
            >
                {CELLS.map((cell) => (
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
                            <img src={`/assets/blanket/c-heart-${cell.isHeart ? 1 : 2}.png`} alt="" draggable={false} />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
