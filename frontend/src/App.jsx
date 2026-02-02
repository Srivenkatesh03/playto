import { useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Header from './components/Header';
import Feed from './components/Feed';
import Leaderboard from './components/Leaderboard';
import PostDetailPage from './pages/PostDetailPage';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

function App() {
  const leaderboardRef = useRef();

  const handleUserAction = () => {
    if (leaderboardRef.current?.refresh) {
      leaderboardRef.current.refresh();
    }
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
          {/* Header */}
          <Header />

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
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
    </AuthProvider>
  );
}

export default App;
