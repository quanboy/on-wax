import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import SessionPage from './pages/SessionPage';
import ScorecardPage from './pages/ScorecardPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import FeedPage from './pages/FeedPage';
import FollowListPage from './pages/FollowListPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/session" element={<SessionPage />} />
        <Route path="/scorecard/:id" element={<ScorecardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/users/:username" element={<ProfilePage />} />
        <Route path="/users/:username/followers" element={<FollowListPage />} />
        <Route path="/users/:username/following" element={<FollowListPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
