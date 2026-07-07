import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BoardList() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [creating, setCreating] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  async function fetchBoards() {
    try {
      const response = await api.get('/boards');
      setBoards(response.data.boards);
    } catch (err) {
      setError('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBoard(e) {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setCreating(true);
    try {
      const response = await api.post('/boards', { name: newBoardName.trim() });
      setBoards([response.data.board, ...boards]);
      setNewBoardName('');
      setShowCreateForm(false);
    } catch (err) {
      setError('Failed to create board');
    } finally {
      setCreating(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="font-mono text-charcoal">Loading boards...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-charcoal/10 px-6 py-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">DevFlow</h1>
        <div className="flex items-center gap-4">
          <span className="font-body text-sm text-charcoal">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="font-body text-sm text-rust hover:underline"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-xl text-ink">Your Boards</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-rust text-paper rounded-lg font-body text-sm font-medium hover:bg-rust-dark transition-colors"
          >
            + New Board
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateBoard} className="mb-6 flex gap-2">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Board name"
              autoFocus
              className="flex-1 px-3 py-2 border border-charcoal/20 rounded-lg bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-rust"
            />
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-ink text-paper rounded-lg font-body text-sm font-medium disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
        )}

        {error && <p className="text-rust-dark font-body text-sm mb-4">{error}</p>}

        {boards.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-charcoal/20 rounded-xl">
            <p className="font-body text-charcoal">No boards yet — create your first one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => navigate(`/boards/${board.id}`)}
                className="text-left p-5 bg-white border border-charcoal/10 rounded-xl hover:border-rust hover:shadow-sm transition-all"
              >
                <h3 className="font-body font-semibold text-ink mb-1">{board.name}</h3>
                <p className="font-mono text-xs text-charcoal/60">
                  Created {new Date(board.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
