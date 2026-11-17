import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ScoreRing from '../components/ScoreRing.jsx';
import { Feedback } from './Interview.jsx';

export default function Result() {
  const { id } = useParams();
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api(`/interviews/${id}`).then(setS).catch((e) => setError(e.message)); }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!s) return <p className="muted">Loading report...</p>;

  return (
    <div className="narrow">
      <section className="panel result-top">
        <ScoreRing value={s.overallScore} size={160} />
        <div>
          <h1>{s.role}</h1>
          <p className="muted cap">{s.difficulty} · {s.questions.length} questions · +{s.xpEarned} XP</p>
          <p>{s.summary}</p>
        </div>
      </section>

      {s.questions.map((q, i) => (
        <details className="panel qa" key={i} open={i === 0}>
          <summary>
            <span>{q.text}</span>
            <b className={q.score >= 75 ? 'good' : q.score >= 50 ? 'warn' : 'bad'}>{q.score}</b>
          </summary>
          <p className="label">Your answer {q.inputMode === 'voice' && <em>(spoken)</em>}</p>
          <p className="answer">{q.answer || 'No answer given.'}</p>
          <Feedback fb={q} />
        </details>
      ))}

      <div className="actions end">
        <Link to="/" className="btn ghost">Dashboard</Link>
        <Link to="/interview" className="btn">Practise again</Link>
      </div>
    </div>
  );
}
