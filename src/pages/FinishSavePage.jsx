import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { readPendingPieces } from '../game/onboardingSession';
import { readAccessToken } from '../services/auth';
import { claimPendingTickets } from '../services/tickets';
import { login, signup } from '../services/users';
import { useBackgroundMusic } from '../utils/useBackgroundMusic';

const NICKNAME_MAX = 12;
const TOAST_MS = 1800;
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]{1,12}$/;

// 배경은 기다림 마치기 화면과 같아서 finish-waiting-page 클래스를 함께 씁니다.
export default function FinishSavePage()
{
    useBackgroundMusic('/assets/sounds/finish.mp3', 0.3);
    const navigate = useNavigate();
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(false);
    const [isEnd, setIsEnd] = useState(false);
    // 완료 화면 제목 (null이면 완료 화면을 보여주지 않음)
    // 로그인돼 있고 옮길 임시 조각이 없으면 이미 저장한 것이므로 저장 안내 없이 완료 화면으로 시작합니다.
    const [doneTitle, setDoneTitle] = useState(() => (
        readAccessToken() && !readPendingPieces().length ? '담요에 이어 붙였어요.' : null
    ));
    const [isNewUser, setIsNewUser] = useState(true);
    const [nickname, setNickname] = useState('');
    const [pin, setPin] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);
    // 가입/로그인 완료 팝업 문구 (빈 문자열이면 숨김)
    const [popup, setPopup] = useState('');

    // PIN은 숫자만 받습니다.
    const onlyDigits = (value) => value.replace(/\D/g, '').slice(0, 4);

    // 입력값을 서버 규칙(닉네임 한글·영문·숫자 1~12자, PIN 숫자 4자리)대로 먼저 검사합니다.
    const validate = () => {
        if (!NICKNAME_PATTERN.test(nickname)) return '닉네임은 한글·영문·숫자 1~12자로 입력해 주세요.';
        if (pin.length !== 4) return 'PIN은 숫자 4자리로 입력해 주세요.';
        if (isNewUser && pin !== pinConfirm) return 'PIN이 서로 달라요.';
        return '';
    };

    // 가입/로그인 요청 후 성공하면 완료 화면으로 넘어갑니다.
    const handleSubmit = async () => {
        if (isSubmitting) return;
        const message = validate();
        if (message) {
            setError(message);
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            // 인증은 됐는데 조각 이전만 실패한 경우, 다시 누르면 이전만 재시도합니다.
            if (!isAuthed) {
                if (isNewUser) {
                    await signup({ nickname, pin, pinConfirm });
                } else {
                    await login({ nickname, pin });
                }
                setIsAuthed(true);
            }
            await claimPendingTickets();
            setPopup(isNewUser ? '가입이 완료되었어요.' : '로그인되었어요.');
        } catch (e) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 탭을 바꾸면 이전 에러와 PIN 확인 값을 지웁니다.
    const handleTab = (newUser) => {
        setIsNewUser(newUser);
        setError('');
        setPinConfirm('');
    };

    // 이미 로그인돼 있으면 로그인 화면 없이 바로 저장(보관 중인 조각 이전)하고 완료 화면으로 갑니다.
    const handleSave = async () => {
        if (!readAccessToken()) {
            setIsLogin(true);
            return;
        }
        if (isSubmitting) return;
        setError('');
        setIsSubmitting(true);
        try {
            await claimPendingTickets();
            setDoneTitle('담요에 이어 붙였어요.');
        } catch (e) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 팝업은 잠시 보여준 뒤 저절로 사라지고 완료 화면으로 넘어갑니다.
    useEffect(() => {
        if (!popup) return undefined;
        const timer = setTimeout(() => {
            setPopup('');
            setDoneTitle('담요에 이어 붙였어요.');
        }, TOAST_MS);
        return () => clearTimeout(timer);
    }, [popup]);

    if (isEnd) {
        return (
            <main className="finish-waiting-page">
                <section key="end" className="finish-save-panel finish-save-panel-end">
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
                <section key="done" className="finish-save-panel finish-save-panel-done">
                    <div className="finish-save-scroll">
                        <h1 className="finish-save-title">{doneTitle}</h1>
                        <img className="finish-save-gift" src="/assets/storage/gift.png" alt="선물 상자" />
                        <button
                            type="button"
                            className="finish-save-btn finish-save-btn-later"
                            onClick={() => navigate('/my-sheep', { replace: true, state: { exitTo: location.state?.exitTo ?? '/finish-waiting/save' } })}
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
                {popup && (
                    <div className="finish-save-toast" role="status">{popup}</div>
                )}
                <section key="login" className="finish-save-panel finish-save-panel-login">
                    <div className="finish-save-scroll">
                        <div className="finish-save-tabs">
                            <button
                                type="button"
                                className={`finish-save-tab${isNewUser ? ' is-active' : ''}`}
                                onClick={() => handleTab(true)}
                            >
                                처음이에요
                            </button>
                            <button
                                type="button"
                                className={`finish-save-tab${isNewUser ? '' : ' is-active'}`}
                                onClick={() => handleTab(false)}
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

                        {error && <p className="finish-save-warning" role="alert">{error}</p>}

                        <button
                            type="button"
                            className="finish-save-submit"
                            disabled={isSubmitting}
                            onClick={handleSubmit}
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
            <section key="ask" className="finish-save-panel">
                <h1 className="finish-save-title">담요 조각을 계정에 저장할까요?</h1>
                <p className="finish-save-desc">저장하고 완성된 나의 담요를 확인하세요.</p>
                <img className="finish-save-gift" src="/assets/storage/gift.png" alt="선물 상자" />
                {error && <p className="finish-save-warning" role="alert">{error}</p>}
                <button
                    type="button"
                    className="finish-save-btn finish-save-btn-primary"
                    disabled={isSubmitting}
                    onClick={handleSave}
                >
                    저장할래요.
                </button>
                <button
                    type="button"
                    className="finish-save-btn finish-save-btn-later"
                    onClick={() => (location.state?.from === 'my-sheep' ? navigate(-1) : setDoneTitle("임시 보관함에 두었어요."))}
                >
                    나중에 할게요.
                </button>
            </section>
        </main>
    );
}
