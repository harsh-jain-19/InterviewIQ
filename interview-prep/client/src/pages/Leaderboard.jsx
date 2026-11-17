import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Leaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/leaderboard').then(setData).catch((e) => setError(e.message)); }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading leaderboard...</p>;

  return (
    <div className="narrow">
      <div className="page-head">
        <div><h1>Leaderboard</h1><p className="muted">Ranked by XP. Finish interviews on harder levels to earn more.</p></div>
        <div className="stat"><span>Your rank</span><strong>#{data.me.rank}</strong></div>
      </div>
      <section className="panel">
        {data.top.length === 0 ? <p className="muted">Nobody has finished an interview yet. Be the first.</p> : (
          <table className="table">
            <thead><tr><th>Rank</th><th>Name</th><th>Interviews</th><th>Avg score</th><th>XP</th></tr></thead>
            <tbody>
              {data.top.map((u) => (
                <tr key={u.id} className={u.id === user._id ? 'me' : ''}>
                  <td><strong>{u.rank}</strong></td><td>{u.name}{u.id === user._id && ' (you)'}</td>
                  <td>{u.interviews}</td><td>{u.avgScore}</td><td><strong>{u.xp}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
