import { BrowserRouter, Route, Routes } from 'react-router-dom';

import OnboardingPage from './pages/OnboardingPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import MySheepPage from './pages/MySheepPage';
import PieceDetailPage from './pages/PieceDetailPage';
import FinishWaitingPage from './pages/FinishWaitingPage';
import FinishSavePage from './pages/FinishSavePage';

export default function App()
{
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
