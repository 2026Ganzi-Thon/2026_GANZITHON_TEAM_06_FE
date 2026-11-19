import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import OnboardingPage from './pages/OnboardingPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import MySheepPage from './pages/MySheepPage';
import PieceDetailPage from './pages/PieceDetailPage';
import FinishWaitingPage from './pages/FinishWaitingPage';
import FinishSavePage from './pages/FinishSavePage';

const CLICK_SOUND = new Audio('/assets/sounds/click.wav');

export default function App()
{
    // 버튼/링크를 누르면 클릭 효과음을 낸다. 자동재생 차단 등으로 실패해도 무시한다.
    useEffect(() =>
    {
        const handleClick = (event) =>
        {
            const target = event.target.closest?.('button, a');

            if (!target || target.disabled)
            {
                return;
            }

            CLICK_SOUND.currentTime = 0;
            CLICK_SOUND.play().catch(() => {});
        };

        document.addEventListener('click', handleClick);

        return () => document.removeEventListener('click', handleClick);
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<OnboardingPage />} />
                <Route path="/waiting-room" element={<WaitingRoomPage />} />
                <Route path="/my-sheep" element={<MySheepPage />} />
                <Route path="/my-sheep/piece/:pieceId" element={<PieceDetailPage />} />
                <Route path="/finish-waiting" element={<FinishWaitingPage />} />
                <Route path="/finish-waiting/save" element={<FinishSavePage />} />
            </Routes>
        </BrowserRouter>
    );
}
