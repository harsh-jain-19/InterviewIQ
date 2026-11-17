import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">InterviewIQ</Link>
        <nav className="nav-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/interview">Practise</NavLink>
          <NavLink to="/questions">Question bank</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
        </nav>
        <div className="nav-user">
          <span className="xp">{user.xp} XP</span>
          <button className="btn ghost small" onClick={logout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
