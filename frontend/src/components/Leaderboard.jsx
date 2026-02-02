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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        🏆 Top Contributors (24h)
      </h2>
      
      {loading ? (
        <div className="text-center text-gray-500 py-4">Loading...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center text-gray-500 py-4">No karma earned yet</div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((user, index) => (
            <div
              key={user.user_id}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:from-blue-50 hover:to-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{medals[index] || '👤'}</span>
                <div>
                  <div className="font-semibold text-gray-900">{user.username}</div>
                  <div className="text-sm text-gray-500">Rank #{index + 1}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{user.karma}</div>
                <div className="text-xs text-gray-500">karma</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
        <p>💡 Karma calculation:</p>
        <p>• Post like = 5 points</p>
        <p>• Comment like = 1 point</p>
      </div>
    </div>
  );
}

export default Leaderboard;
