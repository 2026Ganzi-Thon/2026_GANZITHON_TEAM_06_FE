// 대기실 배경(1442×841) 텍스처 좌표 — 발 위치(벤치 하단 중앙)
export const WAITING_ROOM_TEXTURE_WIDTH = 1442;

export const WAITING_ROOM_BENCH_WIDTH_TEXTURE = 148;

// 벤치 표시 너비(148tex) · sit 스프라이트(48px) 기준 의자당 약 2마리
export const SHEEP_SEATS_PER_BENCH = 2;

// 벤치 앵커(하단 중앙) 기준 — sit 스프라이트 origin(0.5, 1) 발 위치
const BENCH_SEAT_OFFSETS = [
    { x: -28, y: -68 },
    { x: 28, y: -68 }
];

// 와이어프레임(좌측 절반) — 화면 위로 = y 감소 (좌측열 −30, 우측열 −80)
const LEFT_BENCH_Y_BASE = [
    { x: 282, y: 520 },
    { x: 482, y: 512 },
    { x: 272, y: 612 },
    { x: 472, y: 604 },
    { x: 262, y: 704 },
    { x: 462, y: 696 }
];

const LEFT_COLUMN_Y_NUDGE = -30;
const RIGHT_COLUMN_Y_NUDGE = -80;

const LEFT_BENCH_ANCHORS = LEFT_BENCH_Y_BASE.map((anchor, index) =>
{
    const yNudge = index % 2 === 0 ? LEFT_COLUMN_Y_NUDGE : RIGHT_COLUMN_Y_NUDGE;

    return { x: anchor.x, y: anchor.y + yNudge };
});

function buildSymmetricBenchSlots ()
{
    const slots = [];

    LEFT_BENCH_ANCHORS.forEach((anchor) =>
    {
        slots.push({
            x: anchor.x,
            y: anchor.y,
            flipX: false
        });

        slots.push({
            x: WAITING_ROOM_TEXTURE_WIDTH - anchor.x,
            y: anchor.y,
            flipX: true
        });
    });

    return slots;
}

export const WAITING_ROOM_BENCH_SLOTS = buildSymmetricBenchSlots();

// 플레이어 착석: 좌측 앞줄 창가 벤치, 두 자리 중 오른쪽
export const PLAYER_BENCH_ANCHOR = LEFT_BENCH_ANCHORS[4];
export const PLAYER_BENCH_SEAT_INDEX = 1;

// 플레이어 착석 후 바라보는 방향 (우측 아래)
export const PLAYER_SEATED_DIRECTION = 'south-east';

export function getBenchSeatTexture (slot, seatIndex = 0)
{
    const offset = BENCH_SEAT_OFFSETS[seatIndex] ?? BENCH_SEAT_OFFSETS[0];
    const seatX = slot.x + (slot.flipX ? -offset.x : offset.x);

    return {
        x: seatX,
        y: slot.y + offset.y
    };
}

export function getPlayerSeatTexture ()
{
    const playerSlot = {
        x: PLAYER_BENCH_ANCHOR.x,
        y: PLAYER_BENCH_ANCHOR.y,
        flipX: false
    };

    return getBenchSeatTexture(playerSlot, PLAYER_BENCH_SEAT_INDEX);
}

// 개발 중 저장 시 Phaser 씬은 그대로라, 슬롯을 다시 읽도록 알림
if (import.meta.hot)
{
    import.meta.hot.accept(() =>
    {
        import('../EventBus').then(({ EventBus }) =>
        {
            EventBus.emit('refresh-waiting-room-bench-layout');
        });
    });
}