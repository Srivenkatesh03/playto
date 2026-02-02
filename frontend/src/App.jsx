import { useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Feed from './components/Feed';
import Leaderboard from './components/Leaderboard';
import PostDetailPage from './pages/PostDetailPage';
import './App.css';

function App() {
  const leaderboardRef = useRef();

  const handleUserAction = () => {
    if (leaderboardRef.current?.refresh) {
      leaderboardRef.current.refresh();
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-xl border-b-4 border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 flex items-center gap-3 drop-shadow-lg">
              <span className="text-4xl md:text-5xl animate-pulse-slow">🎮</span>
              Playto Community Feed
            </h1>
            <p className="text-blue-100 text-sm md:text-base font-medium">
              Share, discuss, and connect with the community
            </p>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <Routes>
            <Route
              path="/"
              element={
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Feed section */}
                  <div className="lg:col-span-2">
                    <Feed onUserAction={handleUserAction} />
                  </div>

                  {/* Sidebar with leaderboard */}
                  <div className="lg:col-span-1">
                    <Leaderboard ref={leaderboardRef} />
                  </div>
                </div>
              }
            />
            <Route
              path="/posts/:id"
              element={<PostDetailPage onUserAction={handleUserAction} />}
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-gray-800 via-gray-900 to-black border-t-4 border-blue-500 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-3xl">🚀</span>
                <p className="text-white font-bold text-lg md:text-xl">
                  Playto Community Feed
                </p>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Built with Django & React • Powered by Community
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>© 2024 Playto</span>
                <span>•</span>
                <span>Made with ❤️</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
