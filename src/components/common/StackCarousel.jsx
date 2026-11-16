import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// ── 튜닝 값 (카드 자기 크기에 대한 %) ─────────────────────
const STACK_X = 40; // 더미가 가운데에서 밀려난 가로 거리
const STACK_Y = 25; // 더미가 내려간 세로 거리
const ROT = 14.54; // 더미에 누운 각도(deg)
const FAR_X = STACK_X + 7; // 더미 "뒤" 자리 (여기서 투명해짐)
const FAR_Y = STACK_Y + 6;
const DIM = 0.72; // 더미에 누운 카드의 밝기

// d = 카드 위치 - 현재 스크롤 위치(장 단위). 0 = 가운데, ±1 = 더미, ±2 = 더미 뒤
const POSE_D = [-2, -1, 0, 1, 2];
const POSE_X = [-FAR_X, -STACK_X, 0, STACK_X, FAR_X];
const POSE_Y = [FAR_Y, STACK_Y, 0, STACK_Y, FAR_Y];
const POSE_ROT = [-ROT, -ROT, 0, ROT, ROT];

// 구간 선형 보간 (범위 밖은 끝 값으로 고정)
function interpolate(x, inputs, outputs)
{
    if (x <= inputs[0]) return outputs[0];

    for (let i = 1; i < inputs.length; i++)
    {
        if (x <= inputs[i])
        {
            const t = (x - inputs[i - 1]) / (inputs[i] - inputs[i - 1]);
            return outputs[i - 1] + t * (outputs[i] - outputs[i - 1]);
        }
    }

    return outputs[outputs.length - 1];
}

// 가운데 카드가 맨 위에 놓이고, 양옆 카드는 더미처럼 비스듬히 쌓이는 캐러셀입니다.
// 스와이프(스크롤 스냅)와 index 변경 모두로 넘어가며, 부모는 index/onIndexChange 로 제어합니다.
// 가운데 카드를 누르면 onPressCurrent, 옆 카드를 누르면 그 카드로 넘어갑니다.
export default function StackCarousel({ items, keyOf, index, onIndexChange, onPressCurrent, renderCard, getLabel })
{
    const scrollerRef = useRef(null);
    const initialIndex = useRef(index);
    const settlingTo = useRef(null); // 코드로 이동 중일 때의 목표 장 (스크롤 이벤트가 index 를 되돌리지 않게)
    const [pos, setPos] = useState(index); // 소수 포함 스크롤 위치(장 단위)

    // 처음 그릴 때 현재 조각 위치로 맞춘다.
    useLayoutEffect(() =>
    {
        const el = scrollerRef.current;
        el.scrollLeft = initialIndex.current * el.clientWidth;
    }, []);

    // 부모가 index 를 바꾸면(화살표 등) 그 장으로 부드럽게 이동한다.
    useEffect(() =>
    {
        const el = scrollerRef.current;
        if (Math.round(el.scrollLeft / el.clientWidth) === index) return;

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        settlingTo.current = index;
        el.scrollTo({ left: index * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    }, [index]);

    const handleScroll = (e) =>
    {
        const { scrollLeft, clientWidth } = e.currentTarget;
        const next = scrollLeft / clientWidth;
        setPos(next);

        if (settlingTo.current !== null)
        {
            if (Math.abs(next - settlingTo.current) < 0.02) settlingTo.current = null;
            return;
        }

        const rounded = Math.round(next);
        if (rounded !== index) onIndexChange(rounded);
    };

    // 가운데에서 먼 카드부터 그려야 지금 카드가 맨 위에 옵니다.
    const drawOrder = items
        .map((_, i) => i)
        .sort((a, b) => Math.abs(b - pos) - Math.abs(a - pos));

    return (
        <div className="my-sheep-stack">
            {/* 그리는 층: 입력은 아래 판이 받으므로 통과시킴 */}
            <div className="my-sheep-stack__deck" aria-hidden="true">
                {drawOrder.map((i) =>
                {
                    const item = items[i];
                    const d = i - pos;
                    const x = interpolate(d, POSE_D, POSE_X);
                    const y = interpolate(d, POSE_D, POSE_Y);
                    const rot = interpolate(d, POSE_D, POSE_ROT);
                    const distance = Math.abs(d);

                    // 런타임에 정해지는 값이라 인라인으로 둔다.
                    const style = {
                        transform: `translate(-50%, 0) translate(${x}%, ${y}%) rotate(${rot}deg)`,
                        opacity: interpolate(distance, [0, 1, 2], [1, 1, 0]),
                        filter: `brightness(${interpolate(distance, [0, 1], [1, DIM])})`,
                    };

                    return (
                        <div key={keyOf(item)} className="my-sheep-stack__slot" style={style}>
                            {renderCard(item)}
                        </div>
                    );
                })}
            </div>

            {/* 입력을 받는 투명한 페이징 판 */}
            <div
                ref={scrollerRef}
                className="my-sheep-stack__track"
                onScroll={handleScroll}
                onPointerDown={() => { settlingTo.current = null; }}
            >
                {items.map((item, i) => (
                    <button
                        key={keyOf(item)}
                        type="button"
                        className="my-sheep-stack__page"
                        aria-label={getLabel(item)}
                        onClick={() => (i === index ? onPressCurrent?.(item) : onIndexChange(i))}
                    />
                ))}
            </div>
        </div>
    );
}
