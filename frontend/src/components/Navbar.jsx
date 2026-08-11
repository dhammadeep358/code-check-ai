import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="navbar">
      <div className="brand">🛡️ AI Code Review Assistant</div>
      <nav>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/review/new" className={({ isActive }) => (isActive ? 'active' : '')}>
          New Review
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => (isActive ? 'active' : '')}>
          History
        </NavLink>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{user?.fullName}</span>
        <button onClick={handleLogout}>Logout</button>
      </nav>
    </div>
  );
}
