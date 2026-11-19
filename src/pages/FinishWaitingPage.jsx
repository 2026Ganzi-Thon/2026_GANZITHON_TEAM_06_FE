import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AppHeader from '../components/common/AppHeader';
import ChatPanel from '../components/common/ChatPanel';
import ChoiceButton from '../components/common/ChoiceButton';
import GiftView from '../components/finishWaiting/GiftView';
import { INTRO_STEP, SCENARIOS } from '../data/finishWaitingScenarios';
import { toPiece } from '../data/pieces';
import { readGuestToken, readOnboardingTrip } from '../game/onboardingSession';
import { endTicket, fetchTicket } from '../services/tickets';

// 받은 조각이 상자에서 나오는 연출을 보여 준 뒤 저장 화면으로 넘어가기까지의 시간(ms)
const RECEIVE_ANIMATION_MS = 2200;
// 대화 패널이 내려가며 사라지는 시간(ms). finish-waiting.css의 chat-panel-fall 길이와 같게 둔다.
const CHAT_EXIT_MS = 350;

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
    // 마지막 대사 뒤 대화 패널이 내려가는 중인지 (끝나면 담요 조각 받기 화면으로 바뀝니다)
    const [isChatClosing, setIsChatClosing] = useState(false);
    const [error, setError] = useState('');
    const [isEnding, setIsEnding] = useState(false);
    // 방금 받은 담요 조각 이미지 (있으면 연출 중)
    const [receivedImage, setReceivedImage] = useState(null);

    // 연출이 끝나면 저장 화면으로 이동합니다.
    useEffect(() => {
        if (!receivedImage) return undefined;
        const timer = setTimeout(() => navigate('/finish-waiting/save'), RECEIVE_ANIMATION_MS);
        return () => clearTimeout(timer);
    }, [receivedImage, navigate]);

    useEffect(() => {
        if (!isChatClosing) return undefined;
        const timer = setTimeout(() => setIsGift(true), CHAT_EXIT_MS);
        return () => clearTimeout(timer);
    }, [isChatClosing]);

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
            setIsChatClosing(true);
        }
    };

    // 받은 도안의 조각 이미지를 연출로 보여 줍니다. 이미지가 없으면(알 수 없는 도안) 바로 저장 화면으로 갑니다.
    const showReceivedPiece = (patternCode) => {
        const image = toPiece({ patternCode }, 0).image;
        if (image) setReceivedImage(image);
        else navigate('/finish-waiting/save');
    };

    // 담요 조각을 받으면서 기다림을 종료합니다.
    const handleReceive = async () => {
        const trip = readOnboardingTrip();
        if (!trip?.ticketId) {
            setError('승차권 정보를 찾을 수 없어요.');
            return;
        }
        if (isEnding) return;
        setError('');
        setIsEnding(true);
        try {
            const piece = await endTicket({ ticketId: trip.ticketId, endReasonIndex: selected, guestToken: readGuestToken() });
            showReceivedPiece(piece.patternCode);
        } catch (e) {
            // 이미 종료된 기다림이면(뒤로 가기·새로고침 등) 종료는 끝난 것이니, 승차권의 도안으로 같은 연출을 보여 준 뒤 넘어갑니다.
            if (e.code === 'TICKET_ALREADY_ENDED') {
                try {
                    showReceivedPiece((await fetchTicket(trip.ticketId)).patternCode);
                } catch {
                    navigate('/finish-waiting/save');
                }
                return;
            }
            setError(e.message);
            setIsEnding(false);
        }
    };

    if (isGift)
    {
        return (
            <main className="finish-waiting-page">
                <AppHeader collapseOnDrag />
                <GiftView onReceive={handleReceive} receivedImage={receivedImage} disabled={isEnding} />
                {error && <p className="finish-save-warning" role="alert">{error}</p>}
            </main>
        );
    }

    return (
        <main className="finish-waiting-page">
            <AppHeader collapseOnDrag />
            <div className="finish-waiting-menu">
                <Link to="/waiting-room" className="finish-waiting-back">아직 더 기다릴래요 &gt;</Link>
                {OPTIONS.map((option, index) => (
                    <ChoiceButton
                        key={option.title}
                        index={index + 1}
                        title={option.title}
                        subtitle={option.subtitle}
                        selected={selected === index}
                        hidden={step > 0}
                        onClick={() => handleSelect(index)}
                    />
                ))}
            </div>
            <ChatPanel portrait={current.portrait} message={current.message} onNext={handleNext} closing={isChatClosing} typing />
        </main>
    );
}
