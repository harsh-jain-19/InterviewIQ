import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

export default function Questions() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [roles, setRoles] = useState([]);
  const [filters, setFilters] = useState({ role: '', difficulty: '', category: '', q: '', page: 1 });
  const [form, setForm] = useState({ text: '', role: '', difficulty: 'medium', category: 'technical' });
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    api(`/questions?${qs}`).then(setData).catch((e) => setMsg(e.message));
    api('/questions/meta').then((d) => setRoles(d.roles)).catch(() => {});
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const f = (k) => (e) => setFilters({ ...filters, [k]: e.target.value, page: 1 });

  const add = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await api('/questions', { method: 'POST', body: form });
      setForm({ ...form, text: '' }); setMsg('Question added'); load();
    } catch (err) { setMsg(err.message); }
  };

  const remove = async (id) => {
    try { await api(`/questions/${id}`, { method: 'DELETE' }); load(); } catch (err) { setMsg(err.message); }
  };

  return (
    <>
      <div className="page-head"><div><h1>Question bank</h1><p className="muted">{data.total} questions. Generated and seeded questions are added automatically.</p></div></div>

      <div className="filters">
        <input placeholder="Search questions" value={filters.q} onChange={f('q')} aria-label="Search" />
        <select value={filters.role} onChange={f('role')} aria-label="Role"><option value="">All roles</option>{roles.map((r) => <option key={r}>{r}</option>)}</select>
        <select value={filters.difficulty} onChange={f('difficulty')} aria-label="Difficulty"><option value="">Any level</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        <select value={filters.category} onChange={f('category')} aria-label="Type"><option value="">Any type</option><option value="technical">Technical</option><option value="behavioral">Behavioral</option></select>
      </div>

      <section className="panel">
        {data.items.length === 0 && <p className="muted">No questions match these filters.</p>}
        {data.items.map((q) => (
          <div className="qrow" key={q._id}>
            <div>
              <p>{q.text}</p>
              <p className="meta"><span className="tag">{q.role}</span><span className="tag soft cap">{q.difficulty}</span><span className="tag soft cap">{q.category}</span><span className="tag soft">{q.source}</span></p>
              {open === q._id && q.idealPoints?.length > 0 && <ul className="points">{q.idealPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>}
            </div>
            <div className="qactions">
              {q.idealPoints?.length > 0 && <button className="btn ghost small" onClick={() => setOpen(open === q._id ? null : q._id)}>{open === q._id ? 'Hide hints' : 'Show hints'}</button>}
              <button className="btn ghost small" onClick={() => remove(q._id)}>Delete</button>
            </div>
          </div>
        ))}
        <div className="pager">
          <button className="btn ghost small" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
          <span className="muted">Page {data.page || 1} of {data.pages || 1}</span>
          <button className="btn ghost small" disabled={filters.page >= data.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
        </div>
      </section>

      <form className="panel" onSubmit={add}>
        <h3>Add your own question</h3>
        <label>Question<textarea rows={2} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required /></label>
        <div className="row">
          <label>Role<input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required /></label>
          <label>Difficulty<select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          <label>Type<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="technical">Technical</option><option value="behavioral">Behavioral</option></select></label>
        </div>
        <div className="actions"><button className="btn">Add question</button>{msg && <span className="muted" role="status">{msg}</span>}</div>
      </form>
    </>
  );
}
