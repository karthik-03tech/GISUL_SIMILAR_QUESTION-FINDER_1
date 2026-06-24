import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, DatabaseZap, History, BarChart2, TrendingUp, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

interface Summary {
  total_questions: number;
  topics_explored: number;
  avg_similarity_score: number;
  questions_this_week: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: ['analytics-summary'],
    queryFn: () => apiClient.get('/analytics/summary').then((r) => r.data),
  });

  return (
    <>
      <header style={{ marginBottom: 48 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Welcome back{user?.display_name ? `, ${user.display_name}` : ''}!
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, margin: 0 }}>
            Here is a quick overview of your study history and activities.
          </p>
        </header>

        {/* Quick Actions Grid */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            
            <button 
              className="card" 
              style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', border: 'none', transition: 'transform 0.2s, box-shadow 0.2s', background: 'var(--surface)' }}
              onClick={() => navigate('/ask')}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37,99,235,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: 16 }}>
                <MessageSquare size={24} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Ask Question</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Find similar concepts</div>
            </button>

            <button 
              className="card" 
              style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', border: 'none', transition: 'transform 0.2s, box-shadow 0.2s', background: 'var(--surface)' }}
              onClick={() => navigate('/bulk-add')}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37,99,235,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: 16 }}>
                <DatabaseZap size={24} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Bulk Add</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Import many at once</div>
            </button>

            <button 
              className="card" 
              style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', border: 'none', transition: 'transform 0.2s, box-shadow 0.2s', background: 'var(--surface)' }}
              onClick={() => navigate('/history')}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37,99,235,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: 16 }}>
                <History size={24} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>View History</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Browse past matches</div>
            </button>

            <button 
              className="card" 
              style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', border: 'none', transition: 'transform 0.2s, box-shadow 0.2s', background: 'var(--surface)' }}
              onClick={() => navigate('/analytics')}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37,99,235,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: 16 }}>
                <BarChart2 size={24} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Analytics</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Track your progress</div>
            </button>

          </div>
        </section>

        {/* At a Glance */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>At a Glance</h2>
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => navigate('/analytics')}>
              View Detailed Analytics
            </button>
          </div>
          
          <div className="card" style={{ padding: 32 }}>
            {isLoading ? (
              <div style={{ display: 'flex', gap: 20 }}>
                <div className="skeleton" style={{ height: 60, flex: 1 }} />
                <div className="skeleton" style={{ height: 60, flex: 1 }} />
                <div className="skeleton" style={{ height: 60, flex: 1 }} />
              </div>
            ) : summary ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
                <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: 'rgba(37, 99, 235, 0.05)', padding: 12, borderRadius: 10, color: 'var(--primary)' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>Questions This Week</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{summary.questions_this_week}</div>
                  </div>
                </div>
                
                <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: 'rgba(37, 99, 235, 0.05)', padding: 12, borderRadius: 10, color: 'var(--primary)' }}>
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>Total Questions</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{summary.total_questions}</div>
                  </div>
                </div>

                <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: 'rgba(37, 99, 235, 0.05)', padding: 12, borderRadius: 10, color: 'var(--primary)' }}>
                    <Tag size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>Topics Explored</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{summary.topics_explored}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
                No data available yet. Start asking questions!
              </div>
            )}
          </div>
        </section>

    </>
  );
}
