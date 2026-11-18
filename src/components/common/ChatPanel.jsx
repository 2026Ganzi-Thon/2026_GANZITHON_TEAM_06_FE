// 몽실 역장 대화 패널 (기다림 마치기, 대기실 열차 안내, 온보딩이 함께 씁니다).
// portrait: 초상화 파일 이름(portrait04 등), message: 본문(줄바꿈은 개행 문자),
// onNext: 다음 버튼 동작(없으면 버튼을 그리지 않음), nextDisabled: 다음 버튼 비활성화, children: 다음 버튼 아래에 둘 추가 버튼,
// closing: true면 아래로 내려가며 사라지는 연출을 보여 줌 (끝난 뒤 지우는 건 부모가 한다)
export default function ChatPanel ({ portrait, message, onNext, nextDisabled = false, closing = false, children })
{
    return (
        <section className={closing ? 'finish-waiting-panel is-closing' : 'finish-waiting-panel'}>
            <img className="finish-waiting-portrait" src={`/assets/common/${portrait}.png`} alt="몽실 역장" />
            <p className="finish-waiting-message">{message}</p>
            {onNext && (
                <button type="button" className="finish-waiting-next" aria-label="다음" disabled={nextDisabled} onClick={onNext}>
                    <img src="/assets/common/btn-next.png" alt="" />
                </button>
            )}
            {children && <div className="finish-waiting-extra">{children}</div>}
        </section>
    );
}
