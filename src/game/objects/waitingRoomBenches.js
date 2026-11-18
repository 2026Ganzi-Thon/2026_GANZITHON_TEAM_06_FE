// 대기실 배경(1442×841) 텍스처 좌표 — 발 위치(벤치 하단 중앙)
export const WAITING_ROOM_TEXTURE_WIDTH = 1442;

export const WAITING_ROOM_BENCH_WIDTH_TEXTURE = 148;

// 벤치당 3좌석 (148tex 너비 기준 좌·중·우)
export const SHEEP_SEATS_PER_BENCH = 3;

// 화면 기준 좌하(0) 아래·우상(2) 위 — 월드 y+ = 아래
export const BENCH_SEAT_WORLD_Y_NUDGE = [6, 0, -6];

// 벤치 앵커(하단 중앙) 기준 안장: 좌하 → 우상 대각선
const SEAT_ORIGIN = { x: -36, y: -60 };
const SEAT_AXIS_STEP = { dx: 36, dy: -6 };

function getBenchSeatOffset (seatIndex)
{
    return {
        x: SEAT_ORIGIN.x + SEAT_AXIS_STEP.dx * seatIndex,
        y: SEAT_ORIGIN.y + SEAT_AXIS_STEP.dy * seatIndex
    };
}

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

// 플레이어 벤치 슬롯 인덱스(좌측 앞줄 5번 벤치 = 8)
export const PLAYER_BENCH_SLOT_INDEX = 8;

// 플레이어: 3좌석 중 우상(인덱스 2)
export const PLAYER_BENCH_ANCHOR = LEFT_BENCH_ANCHORS[4];
export const PLAYER_BENCH_SEAT_INDEX = 2;

// 플레이어 착석 후 바라보는 방향 (우측 아래)
export const PLAYER_SEATED_DIRECTION = 'south-east';

export function getSitDirectionForBenchSlot (slot)
{
    // 좌측 열: 방 중앙(우측)을 봄 — 우측 열: 방 중앙(좌측)을 봄
    return slot.flipX ? 'south-west' : 'south-east';
}

export function getBenchSeatWorldYNudge (seatIndex)
{
    return BENCH_SEAT_WORLD_Y_NUDGE[seatIndex] ?? 0;
}

export function getBenchSeatTexture (slot, seatIndex = 0)
{
    const offset = getBenchSeatOffset(seatIndex);
    const seatX = slot.x + (slot.flipX ? -offset.x : offset.x);
    const seatY = slot.y + offset.y;

    return {
        x: seatX,
        y: seatY
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

// 털실 위치(벤치 하단 중앙 기준): 바깥쪽 열은 바깥으로, 안쪽 열은 안쪽(복도 쪽)으로 벤치 옆에 놓아 겹치지 않게 한다.
export function getPlayerWoolTexture (woolWidth, gap)
{
    const center = WAITING_ROOM_TEXTURE_WIDTH / 2;
    const isOuter = Math.abs(PLAYER_BENCH_ANCHOR.x - center) > center / 2;
    const isLeftSide = PLAYER_BENCH_ANCHOR.x < center;
    const direction = (isLeftSide ? -1 : 1) * (isOuter ? 1 : -1);

    return {
        x: PLAYER_BENCH_ANCHOR.x + direction * (WAITING_ROOM_BENCH_WIDTH_TEXTURE / 2 + gap + woolWidth / 2),
        y: PLAYER_BENCH_ANCHOR.y
    };
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