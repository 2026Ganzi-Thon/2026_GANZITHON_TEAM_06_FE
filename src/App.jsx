import { BrowserRouter, Route, Routes } from 'react-router-dom';

import OnboardingPage from './pages/OnboardingPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import CollectionPage from './pages/CollectionPage';
import MySheepPage from './pages/MySheepPage';
import PieceDetailPage from './pages/PieceDetailPage';

export default function App()
{
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<OnboardingPage />} />
                <Route path="/waiting-room" element={<WaitingRoomPage />} />
                <Route path="/collection" element={<CollectionPage />} />
                <Route path="/my-sheep" element={<MySheepPage />} />
                <Route path="/my-sheep/piece/:pieceId" element={<PieceDetailPage />} />
            </Routes>
        </BrowserRouter>
    );
}
