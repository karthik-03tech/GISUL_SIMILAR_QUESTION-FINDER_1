import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import SimilarityCard from '../components/SimilarityCard';
import TopicBadge from '../components/TopicBadge';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/client';
import axios from 'axios';

interface SimilarQ {
  id: string; question_text: string; score: number; score_percent: number;
  explanation: string; topic: string;
}
interface QuestionResult {
  id: string; question_text: string; topic: string; topic_color: string;
  confidence: number; similar_questions: SimilarQ[]; created_at: string;
}

const STEPS = ['embedding', 'searching', 'tagging', 'saving', 'done'] as const;
const STEP_LABELS: Record<string, string> = {
  embedding: 'Analysing your question...',
  searching: 'Searching similar questions...',
  tagging: 'Assigning topic...',
  saving: 'Saving results...',
  done: '',
};

const CLIENT_ID = crypto.randomUUID();

export default function AskQuestion() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { step, detail } = useWebSocket(loading ? CLIENT_ID : '');

  // "/" shortcut to focus textarea
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      if (e.key === 'Escape') textareaRef.current?.blur();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const progressPct = () => {
    const idx = STEPS.indexOf(step as typeof STEPS[number]);
    return idx < 0 ? 0 : ((idx + 1) / STEPS.length) * 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 5) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.post<QuestionResult>(
        `/questions?client_id=${CLIENT_ID}`,
        { question_text: text }
      );
      setResult(res.data);
      setText('');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to submit question. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    addToast('Copied to clipboard!', 'success');
  };

  return (
    <>
        {/* Input card */}
        <div className="card" style={{ padding: 32, marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700 }}>Ask a study question</h1>
          <p style={{ margin: '0 0 24px', color: 'var(--muted)', fontSize: 14 }}>
            Discover what you've explored before
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative' }}>
              <textarea
                ref={textareaRef}
                className="input"
                placeholder="e.g. Why does photosynthesis need light?"
                rows={4}
                style={{ resize: 'vertical', minHeight: 120 }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loading}
              />
              <span style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 12, color: 'var(--muted)' }}>
                {text.length} / 2000
              </span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || text.trim().length < 5}
                style={{ width: 'auto', padding: '0 28px' }}
              >
                <Search size={16} />
                {loading ? 'Searching…' : 'Find Similar Questions'}
              </button>
            </div>
          </form>

          {/* Live progress bar */}
          {loading && (
            <div style={{ marginTop: 20 }}>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progressPct()}%` }} />
              </div>
              {detail && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                  {detail || STEP_LABELS[step]}
                </p>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, color: '#ef4444', fontSize: 14 }}>{error}</div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <TopicBadge name={result.topic} color={result.topic_color} />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                {Math.round(result.confidence * 100)}% confident
              </span>
              <div style={{ flex: 1 }} />
              <button
                className="btn-ghost"
                onClick={() => { setResult(null); setText(''); setTimeout(() => textareaRef.current?.focus(), 50); }}
              >
                Ask another
              </button>
            </div>

            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600 }}>Similar Questions</h2>
            <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontSize: 14 }}>
              {result.similar_questions.length} found
            </p>

            {result.similar_questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 16px', display: 'block' }}>
                  <circle cx="32" cy="32" r="30" stroke="var(--border)" strokeWidth="2" />
                  <path d="M32 20v12M32 40v2" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>
                  You're the first to ask something like this!
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  It's been saved. Come back after asking more questions.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {result.similar_questions.map((q) => (
                  <SimilarityCard key={q.id} question={q} topicColor={result.topic_color} onCopy={handleCopy} />
                ))}
              </div>
            )}
          </div>
        )}
    </>
  );
}
