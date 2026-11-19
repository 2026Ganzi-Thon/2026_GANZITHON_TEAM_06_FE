// 몽실 역장 대화 패널 (기다림 마치기, 대기실 열차 안내, 온보딩이 함께 씁니다).
// portrait: 초상화 파일 이름(portrait04 등), message: 본문(줄바꿈은 개행 문자),
// onNext: 다음 버튼 동작(없으면 버튼을 그리지 않음), nextDisabled: 다음 버튼 비활성화, children: 다음 버튼 아래에 둘 추가 버튼,
// closing: true면 아래로 내려가며 사라지는 연출을 보여 줌 (끝난 뒤 지우는 건 부모가 한다),
// typing: true면 본문을 한 글자씩 타자 치듯 보여 줌
import { useEffect, useState } from 'react';

const TYPING_INTERVAL_MS = 40;

// 본문이 바뀌면 key로 다시 마운트되어 처음부터 쳐진다. 모션 줄이기 설정이면 바로 전체를 보여 준다.
function TypedText ({ text })
{
    const [count, setCount] = useState(() => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? text.length : 0));

    useEffect(() => {
        if (count >= text.length) return undefined;
        const timer = setTimeout(() => setCount(count + 1), TYPING_INTERVAL_MS);
        return () => clearTimeout(timer);
    }, [count, text]);

    return text.slice(0, count);
}

export default function ChatPanel ({ portrait, message, onNext, nextDisabled = false, closing = false, typing = false, children })
{
    return (
        <section className={closing ? 'finish-waiting-panel is-closing' : 'finish-waiting-panel'}>
            <img className="finish-waiting-portrait" src={`/assets/common/${portrait}.png`} alt="몽실 역장" />
            <p className="finish-waiting-message">{typing ? <TypedText key={message} text={message} /> : message}</p>
            {onNext && (
                <button type="button" className="finish-waiting-next" aria-label="다음" disabled={nextDisabled} onClick={onNext}>
                    <img src="/assets/common/btn-next.png" alt="" />
                </button>
            )}
            {children && <div className="finish-waiting-extra">{children}</div>}
        </section>
    );
}
