import { Link } from 'react-router-dom';

// blanket-panel.svg(390 x 416.441) 안 3 x 3 칸의 위치. 칸 크기는 97.2639 x 96.3196 입니다.
const BLANKET_W = 390;
const BLANKET_H = 416.441;
const CELL_COLS = [33, 141, 249];
const CELL_ROWS = [50, 160, 270];
const CELL_W = 97.2639;
const CELL_H = 96.3196;

// 담요 그림 위 3 x 3 칸에 조각을 얹어 보여 줍니다.
// getLink를 넘기면 칸을 눌러 그 주소로 이동하고, 없으면(다른 승객의 담요) 그림만 보여 줍니다.
export default function BlanketArt ({ pieces, alt, getLink })
{
    return (
        <div className="my-sheep-blanket__art">
            <img src="/assets/mypage/blanket-panel.svg" alt={alt} />
            {pieces.slice(0, CELL_COLS.length * CELL_ROWS.length).map((piece, i) => {
                const cellStyle = {
                    left: `${(CELL_COLS[i % CELL_COLS.length] / BLANKET_W) * 100}%`,
                    top: `${(CELL_ROWS[Math.floor(i / CELL_COLS.length)] / BLANKET_H) * 100}%`,
                    width: `${(CELL_W / BLANKET_W) * 100}%`,
                    height: `${(CELL_H / BLANKET_H) * 100}%`,
                };
                const image = piece.image && <img src={piece.image} alt="" />;

                return getLink ? (
                    <Link
                        key={`${piece.id}-${i}`}
                        to={getLink(piece)}
                        className="my-sheep-blanket__cell"
                        aria-label={`${piece.name} 조각 보기`}
                        style={cellStyle}
                    >
                        {image}
                    </Link>
                ) : (
                    <span key={`${piece.id}-${i}`} className="my-sheep-blanket__cell" style={cellStyle}>
                        {image}
                    </span>
                );
            })}
        </div>
    );
}
