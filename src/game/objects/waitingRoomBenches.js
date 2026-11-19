// 대기실 배경(1442×841) 텍스처 좌표 — 발 위치(벤치 하단 중앙)
export const WAITING_ROOM_TEXTURE_WIDTH = 1442;

export const WAITING_ROOM_BENCH_WIDTH_TEXTURE = 368;

// 벤치당 3좌석 (148tex 너비 기준 좌·중·우)
export const SHEEP_SEATS_PER_BENCH = 3;

// 화면 기준 좌하(0) 아래·우상(2) 위 — 월드 y+ = 아래
export const BENCH_SEAT_WORLD_Y_NUDGE = [6, 4, 2];

// 벤치 앵커(하단 중앙) 기준 안장: 좌하 → 우상 대각선
const SEAT_ORIGIN = { x: -45, y: -69 };
const SEAT_AXIS_STEP = { dx: 45, dy: -7 };

function getBenchSeatOffset (seatIndex)
{
    return {
        x: SEAT_ORIGIN.x + SEAT_AXIS_STEP.dx * seatIndex,
        y: SEAT_ORIGIN.y + SEAT_AXIS_STEP.dy * seatIndex
    };
}

// 왼쪽 절반 벤치(하단 중앙) 위치. 짝수=바깥 열, 홀수=안쪽 열(맨 앞줄은 안쪽 벤치 없이 5개). 열마다 아래로 갈수록 안쪽으로 모이는 \ / 배치다.
const LEFT_BENCH_ANCHORS = [
    { x: 204, y: 639 },
    { x: 380, y: 587, inner: true },
    { x: 297, y: 731 },
    { x: 482, y: 684, inner: true },
    { x: 455, y: 788 }
];

// 털실 위치 개별 조정(텍스처 px, 번호 = 디버그에 뜨는 슬롯 번호). x+ = 오른쪽, y+ = 아래.
const WOOL_SLOT_NUDGE = [
    { x: 7, y: 10 }, // 0 왼쪽 바깥 1줄
    { x: -10, y: 10 }, // 1 오른쪽 바깥 1줄
    { x: 0, y: -50 }, // 2 왼쪽 안쪽 1줄
    { x: 0, y: -50 }, // 3 오른쪽 안쪽 1줄
    { x: 0, y: 0 }, // 4 왼쪽 바깥 2줄
    { x: 0, y: 0 }, // 5 오른쪽 바깥 2줄
    { x: 0, y: -50 }, // 6 왼쪽 안쪽 2줄
    { x: 0, y: -50 }, // 7 오른쪽 안쪽 2줄
    { x: 20, y: 0 }, // 8 왼쪽 맨 앞 (플레이어)
    { x: 0, y: 0 } // 9 오른쪽 맨 앞
];

function buildSymmetricBenchSlots ()
{
    const slots = [];

    LEFT_BENCH_ANCHORS.forEach((anchor) =>
    {
        slots.push({
            x: anchor.x,
            y: anchor.y,
            inner: anchor.inner,
            woolNudge: WOOL_SLOT_NUDGE[slots.length],
            flipX: false
        });

        slots.push({
            x: WAITING_ROOM_TEXTURE_WIDTH - anchor.x,
            y: anchor.y,
            inner: anchor.inner,
            woolNudge: WOOL_SLOT_NUDGE[slots.length],
            flipX: true
        });
    });

    return slots;
}

export const WAITING_ROOM_BENCH_SLOTS = buildSymmetricBenchSlots();

// 플레이어 벤치 슬롯 인덱스(좌측 앞줄 5번 벤치 = 8)
export const PLAYER_BENCH_SLOT_INDEX = 8;

// 플레이어 벤치 위치: 왼쪽 앞줄 바깥 벤치
export const PLAYER_BENCH_ANCHOR = LEFT_BENCH_ANCHORS[4];

// 플레이어: 3좌석 중 우상(인덱스 2)
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

// 털실 미세 조정(텍스처 px). x+ = 오른쪽, y+ = 아래. 벤치 위치를 바꾸면 여기만 만져 맞춘다.
// 벤치 이미지는 투명 여백이 커서(좌우 256~776, 바닥 676 / 1024px) 실제 벤치 발은 앵커보다 125tex 위, 반폭은 93tex다.
const BENCH_ART_HALF_WIDTH = 93;
const WOOL_NUDGE = { x: 0, y: -120 };
// 바깥 열은 벤치 쪽으로 붙이고 아래로, 안쪽 열은 위로 살짝 옮긴다(텍스처 px).
const WOOL_OUTER_SHIFT = { toBench: 12, down: 10 };
const WOOL_INNER_SHIFT_UP = 10;

// 털실 위치(벤치 하단 중앙 기준): 바깥쪽 열은 바깥으로, 안쪽 열은 안쪽(복도 쪽)으로 벤치 옆에 놓아 겹치지 않게 한다.
export function getWoolTextureForBench (anchor, woolWidth, gap)
{
    const center = WAITING_ROOM_TEXTURE_WIDTH / 2;
    const isOuter = !anchor.inner;
    const isLeftSide = anchor.x < center;
    const direction = (isLeftSide ? -1 : 1) * (isOuter ? 1 : -1);

    const toBench = isOuter ? -direction * WOOL_OUTER_SHIFT.toBench : 0;
    const dy = isOuter ? WOOL_OUTER_SHIFT.down : -WOOL_INNER_SHIFT_UP;

    return {
        x: anchor.x + direction * (BENCH_ART_HALF_WIDTH + gap + woolWidth / 2) + WOOL_NUDGE.x + toBench + (anchor.woolNudge?.x ?? 0),
        y: anchor.y + WOOL_NUDGE.y + dy + (anchor.woolNudge?.y ?? 0)
    };
}

export function getPlayerWoolTexture (woolWidth, gap)
{
    return getWoolTextureForBench(WAITING_ROOM_BENCH_SLOTS[PLAYER_BENCH_SLOT_INDEX], woolWidth, gap);
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