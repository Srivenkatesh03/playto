import Feed from './components/Feed';
import Leaderboard from './components/Leaderboard';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🎮 Playto Community Feed
          </h1>
          <p className="text-gray-600 mt-1">Share, discuss, and connect with the community</p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed section */}
          <div className="lg:col-span-2">
            <Feed />
          </div>

          {/* Sidebar with leaderboard */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Leaderboard />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>Playto Community Feed - Built with Django & React</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
