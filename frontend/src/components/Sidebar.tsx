import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, MessageSquare, History, BarChart2, DatabaseZap, LogOut } from 'lucide-react';

export default function Sidebar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <Link to="/dashboard" className="sidebar-logo">Gisul.</Link>
      
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/ask" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <MessageSquare size={18} /> Ask Question
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <History size={18} /> History
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <BarChart2 size={18} /> Analytics
        </NavLink>
        <NavLink to="/bulk-add" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <DatabaseZap size={18} /> Bulk Add
        </NavLink>
        <button onClick={handleLogout} className="sidebar-link mobile-only-logout">
          <LogOut size={18} /> Sign out
        </button>
      </nav>

      <div className="sidebar-footer">
        {user?.display_name && (
          <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, marginBottom: 12, paddingLeft: 12 }}>
            {user.display_name}
          </div>
        )}
        <button 
          onClick={handleLogout} 
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, borderRadius: 6, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = '#f3f4f6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </aside>
  );
}
