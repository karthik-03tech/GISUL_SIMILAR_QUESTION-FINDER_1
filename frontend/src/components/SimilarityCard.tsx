import TopicBadge from './TopicBadge';
import { Copy } from 'lucide-react';

interface SimilarQuestion {
  id: string;
  question_text: string;
  score: number;
  score_percent: number;
  explanation: string;
  topic: string;
}

interface Props {
  question: SimilarQuestion;
  topicColor?: string;
  onCopy?: (text: string) => void;
}

function getScoreStyle(pct: number): { background: string; color: string } {
  if (pct >= 85) return { background: '#1f2937', color: '#f3f4f6' }; // strong match
  if (pct >= 70) return { background: '#111827', color: '#d1d5db' };
  return { background: 'transparent', color: '#9ca3af' };
}

export default function SimilarityCard({ question, topicColor = '#6b7280', onCopy }: Props) {
  const scoreStyle = getScoreStyle(question.score_percent);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        position: 'relative',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Score badge */}
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <span className="score-badge" style={scoreStyle}>
          {question.score_percent}% similar
        </span>
      </div>

      <p style={{ margin: '0 0 10px', color: 'var(--text)', fontSize: 15, lineHeight: 1.5, paddingRight: 100 }}>
        {question.question_text}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <TopicBadge name={question.topic} color={topicColor} />
        <span style={{ color: 'var(--muted)', fontSize: 13, fontStyle: 'italic', flex: 1 }}>
          {question.explanation}
        </span>
        {onCopy && (
          <button
            className="btn-ghost"
            style={{ padding: '4px 8px', border: 'none' }}
            title="Copy question"
            onClick={() => onCopy(question.question_text)}
          >
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
