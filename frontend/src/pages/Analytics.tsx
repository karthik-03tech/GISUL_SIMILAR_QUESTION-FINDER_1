import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Tag, GitMerge, TrendingUp } from 'lucide-react';
import apiClient from '../api/client';

interface Summary {
  total_questions: number; topics_explored: number;
  avg_similarity_score: number; most_active_topic: string;
  questions_this_week: number; bookmarks_count: number;
}
interface TopicDist { topic: string; color: string; count: number; percentage: number; }
interface ActivityDay { date: string; count: number; }

const TOPIC_COLORS: Record<string, string> = {
  Biology: '#4ade80', // green-400
  Physics: '#60a5fa', // blue-400
  Chemistry: '#fbbf24', // amber-400
  Math: '#a78bfa', // violet-400
  'Computer Science': '#22d3ee', // cyan-400
  History: '#fb923c', // orange-400
};
const DEFAULT_COLOR = '#9ca3af';

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Icon size={18} style={{ color: 'var(--primary)' }} />
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

function Skeleton({ h = 200 }: { h?: number }) {
  return <div className="skeleton" style={{ height: h, borderRadius: 12 }} />;
}

export default function Analytics() {
  const { data: summary, isLoading: sl } = useQuery<Summary>({
    queryKey: ['analytics-summary'],
    queryFn: () => apiClient.get('/analytics/summary').then((r) => r.data),
  });
  const { data: dist, isLoading: dl } = useQuery<TopicDist[]>({
    queryKey: ['analytics-dist'],
    queryFn: () => apiClient.get('/analytics/topic_distribution').then((r) => r.data),
  });
  const { data: activity, isLoading: al } = useQuery<ActivityDay[]>({
    queryKey: ['analytics-activity'],
    queryFn: () => apiClient.get('/analytics/activity').then((r) => r.data),
  });

  // Format X-axis labels — show only Mon/Wed/Fri
  const formatDate = (d: string) => {
    const date = new Date(d);
    const day = date.getDay(); // 0=Sun 1=Mon 3=Wed 5=Fri
    if (![1, 3, 5].includes(day)) return '';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <>
        <h1 style={{ margin: '0 0 32px', fontSize: 28, fontWeight: 700 }}>Analytics</h1>

        {/* Summary cards */}
        {sl ? <Skeleton h={140} /> : summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 36 }}>
            <StatCard icon={MessageSquare} label="Total Questions" value={summary.total_questions} />
            <StatCard icon={Tag} label="Topics Explored" value={summary.topics_explored} />
            <StatCard icon={GitMerge} label="Avg Similarity" value={`${Math.round(summary.avg_similarity_score * 100)}%`} />
            <StatCard icon={TrendingUp} label="This Week" value={summary.questions_this_week} />
          </div>
        )}

        {/* Topic distribution */}
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 600 }}>Topics Explored</h2>
          {dl ? <Skeleton /> : dist && dist.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
              <ResponsiveContainer width={260} height={200}>
                <PieChart>
                  <Pie data={dist} dataKey="count" nameKey="topic" cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90} strokeWidth={0}>
                    {dist.map((entry, i) => <Cell key={i} fill={TOPIC_COLORS[entry.topic] || DEFAULT_COLOR} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {dist.map((d) => (
                  <div key={d.topic} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: TOPIC_COLORS[d.topic] || DEFAULT_COLOR, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, flex: 1, color: TOPIC_COLORS[d.topic] || DEFAULT_COLOR, fontWeight: 500 }}>{d.topic}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>{d.count}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 13, width: 40, textAlign: 'right' }}>
                      {d.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '32px 0' }}>
              No topic data yet
            </p>
          )}
        </div>

        {/* Activity chart */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 600 }}>
            Questions Asked — Last 30 Days
          </h2>
          {al ? <Skeleton /> : activity && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activity} barSize={8}>
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: 'var(--muted)', fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(val) => [`${val ?? 0} question${(val ?? 0) !== 1 ? 's' : ''}`, '']}
                  labelFormatter={(l) => new Date(l as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {activity.map((entry, i) => (
                    <Cell key={i} fill={entry.count > 0 ? 'var(--primary)' : '#2a2a38'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
    </>
  );
}
