import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Copy } from 'lucide-react';
import TopicBadge from '../components/TopicBadge';
import SimilarityCard from '../components/SimilarityCard';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/client';

interface SimilarQ {
  id: string; question_text: string; score: number; score_percent: number;
  explanation: string; topic: string;
}
interface QDetail {
  id: string; question_text: string; topic: string; topic_color: string;
  confidence: number; similar_questions: SimilarQ[]; created_at: string;
}

function SkeletonDetail() {
  return (
    <div className="card" style={{ padding: 32, marginBottom: 24 }}>
      <div className="skeleton" style={{ height: 14, width: '20%', marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 24, width: '85%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 24, width: '65%' }} />
    </div>
  );
}

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [question, setQuestion] = useState<QDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient.get<QDetail>(`/questions/${id}`)
      .then((res) => setQuestion(res.data))
      .catch((err) => {
        if (err.response?.status === 401) navigate('/login');
        else if (err.response?.status === 404) setError('Question not found.');
        else setError('Failed to load question details.');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard!', 'success');
  };

  return (
    <>
        <Link to="/history" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--muted)', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to History
        </Link>

        {loading && <SkeletonDetail />}

        {error && (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {question && (
          <>
            <div className="card" style={{ padding: 32, marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <TopicBadge name={question.topic} color={question.topic_color} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {Math.round(question.confidence * 100)}% confident
                </span>
                <span style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 'auto' }}>
                  {new Date(question.created_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.5, flex: 1 }}>
                  {question.question_text}
                </p>
                <button className="btn-ghost" style={{ border: 'none', flexShrink: 0 }}
                  onClick={() => handleCopy(question.question_text)} title="Copy">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>
              Similar Questions ({question.similar_questions.length})
            </h2>

            {question.similar_questions.length === 0 ? (
              <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                No similar questions were found for this submission.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {question.similar_questions.map((q) => (
                  <SimilarityCard key={q.id} question={q} topicColor={question.topic_color} onCopy={handleCopy} />
                ))}
              </div>
            )}
          </>
        )}
    </>
  );
}
