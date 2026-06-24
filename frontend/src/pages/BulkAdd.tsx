import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseZap } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/client';
import axios from 'axios';

export default function BulkAdd() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const questions = text.split('\n').map(q => q.trim()).filter(q => q.length >= 5);
    
    if (questions.length === 0) {
      setError('Please provide at least one valid question (5+ characters).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{ added_count: number }>('/questions/bulk', { questions });
      addToast(`Successfully added ${res.data.added_count} question(s)!`, 'success');
      navigate('/history');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to bulk add questions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <div className="card" style={{ padding: 32, marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700 }}>Bulk Add Questions</h1>
          <p style={{ margin: '0 0 24px', color: 'var(--muted)', fontSize: 14 }}>
            Paste one question per line. They will be embedded, auto-tagged with a topic, and saved to your history.
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative' }}>
              <textarea
                className="input"
                placeholder="Why does photosynthesis need light?&#10;What is the difference between mitosis and meiosis?"
                rows={10}
                style={{ resize: 'vertical', minHeight: 200, fontFamily: 'monospace' }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && (
              <div style={{ marginTop: 16, color: '#ef4444', fontSize: 14 }}>{error}</div>
            )}
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || text.trim().length < 5}
                style={{ width: 'auto', padding: '0 28px' }}
              >
                <DatabaseZap size={16} />
                {loading ? 'Processing...' : 'Bulk Add Questions'}
              </button>
            </div>
          </form>
        </div>
    </>
  );
}
