import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/progress'), api('/interviews')])
      .then(([p, h]) => { setData(p); setHistory(h); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading your progress...</p>;

  const chart = data.timeline.map((t, i) => ({ n: i + 1, score: t.score, role: t.role }));
  const u = data.user;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hi {user.name.split(' ')[0]}</h1>
          <p className="muted">{u.interviewsCompleted ? 'Keep the streak going with another round.' : 'Take your first mock interview to start tracking progress.'}</p>
        </div>
        <Link to="/interview" className="btn">Start a mock interview</Link>
      </div>

      <div className="stats">
        <div className="stat"><span>Interviews</span><strong>{u.interviewsCompleted}</strong></div>
        <div className="stat"><span>Average score</span><strong>{u.avgScore}</strong></div>
        <div className="stat"><span>Best score</span><strong>{data.best}</strong></div>
        <div className="stat"><span>Total XP</span><strong>{u.xp}</strong></div>
      </div>

      {chart.length > 0 ? (
        <div className="grid2">
          <section className="panel">
            <h3>Score over time</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chart}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="n" tickLine={false} />
                <YAxis domain={[0, 100]} tickLine={false} width={32} />
                <Tooltip formatter={(v) => [v, 'Score']} labelFormatter={(n) => `Interview ${n}`} />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </section>
          <section className="panel">
            <h3>Average by role</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.byRole} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="var(--line)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickLine={false} />
                <YAxis type="category" dataKey="role" width={130} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [v, 'Average']} />
                <Bar dataKey="avg" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      ) : (
        <section className="panel empty">
          <h3>No interviews yet</h3>
          <p className="muted">Your score trend and role breakdown will appear here after your first session.</p>
        </section>
      )}

      {history.length > 0 && (
        <section className="panel">
          <h3>Recent interviews</h3>
          <table className="table">
            <thead><tr><th>Role</th><th>Level</th><th>Score</th><th>XP</th><th>Date</th><th /></tr></thead>
            <tbody>
              {history.slice(0, 8).map((h) => (
                <tr key={h._id}>
                  <td>{h.role}</td>
                  <td className="cap">{h.difficulty}</td>
                  <td><strong>{h.overallScore}</strong></td>
                  <td>+{h.xpEarned}</td>
                  <td>{new Date(h.completedAt).toLocaleDateString()}</td>
                  <td><Link to={`/result/${h._id}`}>View report</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
