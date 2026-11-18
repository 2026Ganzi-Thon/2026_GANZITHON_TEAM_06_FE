import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const NICKNAME_MAX = 12;

// 배경은 기다림 마치기 화면과 같아서 finish-waiting-page 클래스를 함께 씁니다.
export default function FinishSavePage()
{
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(false);
    const [isEnd, setIsEnd] = useState(false);
    // 완료 화면 제목 (null이면 완료 화면을 보여주지 않음)
    const [doneTitle, setDoneTitle] = useState(null);
    const [isNewUser, setIsNewUser] = useState(true);
    const [nickname, setNickname] = useState('');
    const [pin, setPin] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');

    // PIN은 숫자만 받습니다.
    const onlyDigits = (value) => value.replace(/\D/g, '').slice(0, 4);

    if (isEnd) {
        return (
            <main className="finish-waiting-page">
                <section className="finish-save-panel finish-save-panel-end">
                    <h1 className="finish-save-title">
                        여기까지예요.<br />창을 닫아도 괜찮아요.
                    </h1>
                    <img className="finish-save-gift" src="/assets/storage/gift.png" alt="선물 상자" />
                    <button
                        type="button"
                        className="finish-save-btn finish-save-btn-later"
                        onClick={() => navigate('/')}
                    >
                        처음으로
                    </button>
                </section>
            </main>
        );
    }

    if (doneTitle) {
        return (
            <main className="finish-waiting-page">
                <section className="finish-save-panel finish-save-panel-done">
                    <div className="finish-save-scroll">
                        <h1 className="finish-save-title">{doneTitle}</h1>
                        <img className="finish-save-gift" src="/assets/storage/gift.png" alt="선물 상자" />
                        <button
                            type="button"
                            className="finish-save-btn finish-save-btn-later"
                            onClick={() => navigate('/my-sheep')}
                        >
                            내 담요 보기
                        </button>
                        <hr className="finish-save-divider" />
                        <p className="finish-save-desc">다시 기다릴까요?</p>
                        {/* 온보딩의 대기실 선택 단계로 바로 이동한다. */}
                        <button
                            type="button"
                            className="finish-save-btn finish-save-btn-primary finish-save-btn-start"
                            onClick={() => navigate('/', { state: { startStep: 'room' } })}
                        >
                            네, 새 승차권 받기 &gt;
                        </button>
                        <button
                            type="button"
                            className="finish-save-btn finish-save-btn-later"
                            onClick={() => setIsEnd(true)}
                        >
                            아니요
                        </button>
                                    </div>
                </section>
            </main>
        );
    }

    if (isLogin) {
        return (
            <main className="finish-waiting-page">
                <section className="finish-save-panel finish-save-panel-login">
                    <div className="finish-save-scroll">
                        <div className="finish-save-tabs">
                            <button
                                type="button"
                                className={`finish-save-tab${isNewUser ? ' is-active' : ''}`}
                                onClick={() => setIsNewUser(true)}
                            >
                                처음이에요
                            </button>
                            <button
                                type="button"
                                className={`finish-save-tab${isNewUser ? '' : ' is-active'}`}
                                onClick={() => setIsNewUser(false)}
                            >
                                이미 있어요
                            </button>
                        </div>
                        <h1 className="finish-save-title">{isNewUser ? '닉네임 정하기.' : '로그인'}</h1>
                        <p className="finish-save-desc">
                            {isNewUser ? '닉네임과 PIN으로 담요를 보관해요.' : '저장해 둔 닉네임과 PIN을 입력해 주세요.'}
                        </p>

                        <label className="finish-save-field">
                            <span className="finish-save-field-title">닉네임 (최대 12자)</span>
                            <span className="finish-save-input-wrap">
                                <input
                                    className="finish-save-input"
                                    type="text"
                                    placeholder="닉네임을 입력하세요."
                                    maxLength={NICKNAME_MAX}
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                />
                                <span className="finish-save-count">{nickname.length}/{NICKNAME_MAX}</span>
                            </span>
                        </label>

                        <label className="finish-save-field">
                            <span className="finish-save-field-title">PIN 숫자 4자리</span>
                            <input
                                className="finish-save-input"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(onlyDigits(e.target.value))}
                            />
                        </label>

                        {isNewUser && (
                            <>
                                <label className="finish-save-field">
                                    <span className="finish-save-field-title">PIN 확인</span>
                                    <input
                                        className="finish-save-input"
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={4}
                                        value={pinConfirm}
                                        onChange={(e) => setPinConfirm(onlyDigits(e.target.value))}
                                    />
                                </label>
                                <p className="finish-save-warning">
                                    <span className="finish-save-warning-icon" aria-hidden="true">!</span>
                                    PIN을 잊으면 계정을 복구할 수 없어요. 꼭 기억해 주세요.
                                </p>
                            </>
                        )}

                        <button
                            type="button"
                            className="finish-save-submit"
                            onClick={() => { if (!isNewUser) setDoneTitle('담요에 이어 붙였어요.'); }}
                        >
                            {isNewUser ? '가입하기' : '로그인'}
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="finish-waiting-page">
            <section className="finish-save-panel">
                <h1 className="finish-save-title">담요 조각을 계정에 저장할까요?</h1>
                <p className="finish-save-desc">저장하고 완성된 나의 담요를 확인하세요.</p>
                <img className="finish-save-gift" src="/assets/storage/gift.png" alt="선물 상자" />
                <button
                    type="button"
                    className="finish-save-btn finish-save-btn-primary"
                    onClick={() => setIsLogin(true)}
                >
                    저장할래요.
                </button>
                <button
                    type="button"
                    className="finish-save-btn finish-save-btn-later"
                    onClick={() => setDoneTitle("임시 보관함에 두었어요.")}
                >
                    나중에 할게요.
                </button>
            </section>
        </main>
    );
}
