import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bookmark, BookmarkCheck } from 'lucide-react';
import TopicBadge from '../components/TopicBadge';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/client';
import axios from 'axios';

interface HistoryItem {
  id: string; question_text: string; topic: string; topic_color: string;
  confidence: number; match_count: number; is_bookmarked: boolean; created_at: string;
}

interface PagedResp { items: HistoryItem[]; total: number; page: number; limit: number; has_more: boolean; }

const TOPICS = ['All', 'Biology', 'Physics', 'Chemistry', 'Math', 'Computer Science', 'History'];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m || 1} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', gap: 12 }}>
      <div style={{ width: 4, borderRadius: 4, background: 'var(--border)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 12, width: '30%' }} />
      </div>
    </div>
  );
}

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [topic, setTopic] = useState('All');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPage = useCallback(async (pageNum: number, reset: boolean) => {
    if (reset) { setLoading(true); setItems([]); }
    else setLoadingMore(true);
    try {
      const params: Record<string, string | number> = { page: pageNum, limit: 20 };
      if (topic !== 'All') params.topic = topic;
      if (search) params.search = search;
      const res = await apiClient.get<PagedResp>('/questions/history', { params });
      setItems((prev) => reset ? res.data.items : [...prev, ...res.data.items]);
      setTotal(res.data.total);
      setHasMore(res.data.has_more);
      setPage(pageNum);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [topic, search, navigate]);

  useEffect(() => { fetchPage(1, true); }, [fetchPage]);

  const toggleBookmark = async (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiClient.post<{ bookmarked: boolean }>(`/questions/${item.id}/bookmark`);
      const bookmarked = res.data.bookmarked;
      setItems((prev) => prev.map((q) => q.id === item.id ? { ...q, is_bookmarked: bookmarked } : q));
      addToast(bookmarked ? 'Bookmarked!' : 'Bookmark removed', 'success');
    } catch { addToast('Failed to toggle bookmark', 'error'); }
  };

  return (
    <>
        <div style={{ marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Your Question History</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
            {total} questions across {TOPICS.filter((t) => t !== 'All').filter((t) =>
              items.some((q) => q.topic === t)).length} topics
          </p>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              className="input"
              placeholder="Search questions…"
              style={{ paddingLeft: 38 }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TOPICS.map((t) => {
              const active = topic === t;
              return (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: `1px solid var(--border)`,
                    background: active ? 'var(--primary)' : 'transparent',
                    color: active ? '#000' : 'var(--text)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 16px', display: 'block' }}>
              <rect x="8" y="14" width="20" height="26" rx="3" stroke="var(--border)" strokeWidth="2" />
              <rect x="16" y="8" width="20" height="26" rx="3" stroke="var(--border)" strokeWidth="2" />
              <rect x="24" y="22" width="20" height="26" rx="3" stroke="var(--muted)" strokeWidth="2" />
            </svg>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>No questions yet</p>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
              Ask your first question to get started
            </p>
            <button className="btn-primary" style={{ width: 'auto', padding: '0 24px' }}
              onClick={() => navigate('/ask')}>
              Ask a question
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style={{ display: 'flex', cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.2s' }}
                  onClick={() => navigate(`/history/${item.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ width: 4, alignSelf: 'stretch', background: 'var(--border)', borderRadius: '4px 0 0 4px' }} />
                  <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ margin: '0 0 10px', color: 'var(--text)', fontSize: 15, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.question_text}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <TopicBadge name={item.topic} color={item.topic_color} />
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>{timeAgo(item.created_at)}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                        {item.match_count} similar match{item.match_count !== 1 ? 'es' : ''}
                      </span>
                      <div style={{ flex: 1 }} />
                      <button
                        className="btn-ghost"
                        style={{ border: 'none', padding: '4px' }}
                        onClick={(e) => toggleBookmark(item, e)}
                        title={item.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
                      >
                        {item.is_bookmarked
                          ? <BookmarkCheck size={16} style={{ color: 'var(--primary)' }} />
                          : <Bookmark size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button className="btn-ghost" onClick={() => fetchPage(page + 1, false)} disabled={loadingMore}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
    </>
  );
}
