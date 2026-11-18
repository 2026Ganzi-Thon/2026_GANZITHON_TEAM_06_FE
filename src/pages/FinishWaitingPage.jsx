import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AppHeader from '../components/common/AppHeader';
import GiftView from '../components/finishWaiting/GiftView';
import { INTRO_STEP, SCENARIOS } from '../data/finishWaitingScenarios';

const OPTIONS = [
    { title: '답이 왔어요.', subtitle: '기다리던 답을 받았어요.' },
    { title: '기대와 달랐어요.', subtitle: '생각했던 결과와 달랐어요.' },
    { title: '내려 놓을래요.', subtitle: '잠시 기다림을 멈추고 싶어요.' },
];

export default function FinishWaitingPage()
{
    const navigate = useNavigate();
    const [selected, setSelected] = useState(0);
    // 0 = 처음 안내, 1~ = 선택한 버튼의 n번째 대사
    const [step, setStep] = useState(0);
    const [isGift, setIsGift] = useState(false);

    const steps = SCENARIOS[selected];
    const current = step === 0 ? INTRO_STEP : steps[step - 1];

    // 다른 버튼을 고르면 처음 안내부터 다시 시작합니다.
    const handleSelect = (index) => {
        setSelected(index);
        setStep(0);
    };

    // 마지막 대사에서 다음을 누르면 같은 화면에서 담요 조각 받기로 바뀝니다.
    const handleNext = () => {
        if (step < steps.length) {
            setStep(step + 1);
        } else {
            setIsGift(true);
        }
    };

    if (isGift)
    {
        return (
            <main className="finish-waiting-page">
                <AppHeader collapseOnDrag />
                <GiftView onReceive={() => navigate('/finish-waiting/save')} />
            </main>
        );
    }

    return (
        <main className="finish-waiting-page">
            <AppHeader collapseOnDrag />
            <div className="finish-waiting-menu">
                <Link to="/waiting-room" className="finish-waiting-back">아직 더 기다릴래요 &gt;</Link>
                {OPTIONS.map((option, index) => (
                    <button
                        key={option.title}
                        type="button"
                        className={`finish-waiting-btn${selected === index ? ' is-selected' : ''}${step > 0 ? ' is-hidden' : ''}`}
                        aria-pressed={selected === index}
                        onClick={() => handleSelect(index)}
                    >
                        <span className="finish-waiting-num">{index + 1}</span>
                        <span className="finish-waiting-text">
                            <strong>{option.title}</strong>
                            <span>{option.subtitle}</span>
                        </span>
                        {selected === index && (
                            <span className="finish-waiting-check">
                                <img src="/assets/finish-waiting/check.png" alt="선택됨" />
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <section className="finish-waiting-panel">
                <img className="finish-waiting-portrait" src={`/assets/common/${current.portrait}.png`} alt="몽실 역장" />
                <p className="finish-waiting-message">{current.message}</p>
                <button type="button" className="finish-waiting-next" aria-label="다음" onClick={handleNext}>
                    <img src="/assets/common/btn-next.png" alt="" />
                </button>
            </section>
        </main>
    );
}
