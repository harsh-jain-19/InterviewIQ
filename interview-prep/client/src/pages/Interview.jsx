import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import useSpeech from '../hooks/useSpeech.js';

export default function Interview() {
  const { id } = useParams();
  return id ? <Session id={id} /> : <Setup />;
}

/* ------------------------------ Setup ------------------------------ */
function Setup() {
  const nav = useNavigate();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ role: '', difficulty: 'medium', type: 'mixed', count: 5 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api('/questions/meta').then((d) => setRoles(d.roles)).catch(() => {}); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const start = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const s = await api('/interviews/start', { method: 'POST', body: { ...form, count: Number(form.count) } });
      nav(`/interview/${s._id}`);
    } catch (err) {
      setError(err.message); setBusy(false);
    }
  };

  return (
    <form className="panel narrow" onSubmit={start}>
      <h1>New mock interview</h1>
      <p className="muted">Pick any role. Questions are generated for it, and your answers are scored when you submit them.</p>
      <label>Role
        <input list="roles" value={form.role} onChange={set('role')} placeholder="e.g. MERN Stack Developer" required />
        <datalist id="roles">{roles.map((r) => <option key={r} value={r} />)}</datalist>
      </label>
      <div className="row">
        <label>Difficulty
          <select value={form.difficulty} onChange={set('difficulty')}>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
        </label>
        <label>Question type
          <select value={form.type} onChange={set('type')}>
            <option value="mixed">Mixed</option><option value="technical">Technical</option><option value="behavioral">Behavioral</option>
          </select>
        </label>
        <label>Questions
          <select value={form.count} onChange={set('count')}>
            {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Preparing your questions...' : 'Start interview'}</button>
    </form>
  );
}

/* ------------------------------ Session ------------------------------ */
function Session({ id }) {
  const nav = useNavigate();
  const { refreshUser } = useAuth();
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [mode, setMode] = useState('text');
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const speech = useSpeech(setAnswer);

  useEffect(() => {
    api(`/interviews/${id}`).then((s) => {
      if (s.status === 'completed') return nav(`/result/${id}`, { replace: true });
      setSession(s);
      const first = s.questions.findIndex((q) => q.score === null);
      setIdx(first === -1 ? s.questions.length - 1 : first);
    }).catch((e) => setError(e.message));
  }, [id, nav]);

  if (error && !session) return <p className="error">{error}</p>;
  if (!session) return <p className="muted">Loading interview...</p>;

  const total = session.questions.length;
  const q = session.questions[idx];
  const isLast = idx === total - 1;

  const submit = async () => {
    if (speech.listening) speech.stop();
    setBusy(true); setError('');
    try {
      const fb = await api(`/interviews/${id}/answer`, { method: 'POST', body: { index: idx, answer, inputMode: mode } });
      setFeedback(fb);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    if (isLast) {
      setBusy(true);
      try {
        await api(`/interviews/${id}/finish`, { method: 'POST' });
        await refreshUser();
        nav(`/result/${id}`);
      } catch (e) { setError(e.message); setBusy(false); }
      return;
    }
    setIdx(idx + 1); setAnswer(''); setFeedback(null); setMode('text'); setError('');
  };

  const toggleMic = () => {
    if (speech.listening) return speech.stop();
    setMode('voice');
    speech.start(answer);
  };

  return (
    <div className="narrow">
      <div className="progress-head">
        <span>{session.role} · {session.difficulty}</span>
        <span>Question {idx + 1} of {total}</span>
      </div>
      <div className="bar"><div style={{ width: `${((idx + (feedback ? 1 : 0)) / total) * 100}%` }} /></div>

      <section className="panel question">
        <span className="tag">{q.category}</span>
        <h2>{q.text}</h2>

        {!feedback ? (
          <>
            <textarea
              rows={8} value={answer} onChange={(e) => { setAnswer(e.target.value); if (!speech.listening) setMode('text'); }}
              placeholder="Type your answer, or press the microphone and speak..."
              aria-label="Your answer" disabled={busy}
            />
            <div className="actions">
              <button type="button" className={`btn ghost mic ${speech.listening ? 'live' : ''}`} onClick={toggleMic} disabled={busy || !speech.supported}
                title={speech.supported ? '' : 'Voice input needs Chrome or Edge'}>
                <span className="dot" />{speech.listening ? 'Stop recording' : 'Answer by voice'}
              </button>
              <span className="muted small-text">{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
              <button className="btn" onClick={submit} disabled={busy || !answer.trim()}>
                {busy ? 'Evaluating...' : 'Submit answer'}
              </button>
            </div>
            {(speech.error || error) && <p className="error" role="alert">{speech.error || error}</p>}
          </>
        ) : (
          <Feedback fb={feedback} />
        )}
      </section>

      {feedback && (
        <div className="actions end">
          <button className="btn" onClick={next} disabled={busy}>
            {isLast ? (busy ? 'Finishing...' : 'Finish and see report') : 'Next question'}
          </button>
        </div>
      )}
    </div>
  );
}

export function Feedback({ fb }) {
  const color = fb.score >= 75 ? 'good' : fb.score >= 50 ? 'warn' : 'bad';
  return (
    <div className="feedback">
      <div className={`score-pill ${color}`}>{fb.score}<small>/100</small></div>
      {fb.strengths?.length > 0 && (<><h4>What worked</h4><ul>{fb.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></>)}
      {fb.improvements?.length > 0 && (<><h4>How to improve</h4><ul>{fb.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul></>)}
      {fb.idealAnswer && (<><h4>Model answer</h4><p className="model">{fb.idealAnswer}</p></>)}
    </div>
  );
}
