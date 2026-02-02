import { useState, useEffect } from 'react';
import { api } from '../api';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const medals = ['🥇', '🥈', '🥉'];
  
  const gradients = [
    'from-yellow-400 via-yellow-500 to-orange-500',
    'from-gray-300 via-gray-400 to-gray-500',
    'from-orange-400 via-orange-500 to-amber-600',
    'from-blue-400 via-blue-500 to-blue-600',
    'from-purple-400 via-purple-500 to-purple-600',
  ];

  return (
    <div className="card-elevated p-4 md:p-6 animate-fade-in sticky top-4">
      <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
        <span className="text-3xl">🏆</span>
        <span className="text-gradient">Top Contributors</span>
      </h2>
      <p className="text-xs md:text-sm text-gray-500 mb-4">Last 24 hours</p>
      
      {loading ? (
        <div className="text-center text-gray-500 py-8 animate-pulse-slow">
          <div className="text-4xl mb-2">⏳</div>
          <div>Loading...</div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-sm">No karma earned yet</div>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((user, index) => (
            <div
              key={user.user_id}
              className={`group relative overflow-hidden rounded-xl p-4 bg-gradient-to-r ${gradients[index]} shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl md:text-4xl drop-shadow-lg animate-scale-in">
                    {medals[index] || '👤'}
                  </span>
                  <div>
                    <div className="font-bold text-white text-sm md:text-base drop-shadow break-anywhere">
                      {user.username}
                    </div>
                    <div className="text-xs text-white/90 font-medium">
                      Rank #{index + 1}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
                    {user.karma}
                  </div>
                  <div className="text-xs text-white/90 font-medium">karma</div>
                </div>
              </div>
              {/* Decorative overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 group-hover:via-white/20 transition-all duration-300"></div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t-2 border-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-100">
          <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Karma Calculation
          </p>
          <div className="space-y-1 text-xs text-gray-600">
            <p className="flex items-center gap-2">
              <span className="text-blue-500 font-bold">•</span>
              Post like = <span className="font-semibold text-blue-600">5 points</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-purple-500 font-bold">•</span>
              Comment like = <span className="font-semibold text-purple-600">1 point</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
