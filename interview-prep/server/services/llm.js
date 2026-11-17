import Anthropic from '@anthropic-ai/sdk';
import Question from '../models/Question.js';

const MODEL = process.env.LLM_MODEL || 'claude-sonnet-5-5';
let client = null;

export const llmEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);
const getClient = () => (client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));

async function askJSON(system, user, maxTokens = 1500) {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: system + '\nRespond with valid JSON only. No markdown fences, no commentary.',
    messages: [{ role: 'user', content: user }],
  });
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned.slice(cleaned.search(/[\[{]/)));
}

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const arr = (a) => (Array.isArray(a) ? a.map(String).slice(0, 5) : []);

/* ---------- Question generation ---------- */
export async function generateQuestions({ role, difficulty, count, type }) {
  if (llmEnabled()) {
    try {
      const data = await askJSON(
        'You are a senior interviewer who writes realistic interview questions for college placements.',
        `Create ${count} ${difficulty}-level interview questions for the role "${role}".
Question mix: ${type} (technical = concepts and problem solving, behavioral = situational/HR, mixed = both).
Each question must be answerable verbally in 1-3 minutes and must differ from the others.
Return: {"questions":[{"text":"...","category":"technical|behavioral","idealPoints":["key point 1","key point 2","key point 3"]}]}`
      );
      const list = (data.questions || []).slice(0, count).map((q) => ({
        text: String(q.text),
        category: q.category === 'behavioral' ? 'behavioral' : 'technical',
        idealPoints: arr(q.idealPoints),
      }));
      if (list.length) {
        // Save to the bank so the question bank grows over time (ignore duplicates)
        Question.insertMany(
          list.map((q) => ({ ...q, role, difficulty, source: 'ai' })),
          { ordered: false }
        ).catch(() => {});
        return list;
      }
    } catch (err) {
      console.error('LLM question generation failed, using bank:', err.message);
    }
  }
  return fromBank({ role, difficulty, count, type });
}

async function fromBank({ role, difficulty, count, type }) {
  const filter = { role };
  if (type !== 'mixed') filter.category = type;
  let pool = await Question.aggregate([{ $match: { ...filter, difficulty } }, { $sample: { size: count } }]);
  if (pool.length < count) {
    const more = await Question.aggregate([
      { $match: { ...filter, _id: { $nin: pool.map((p) => p._id) } } },
      { $sample: { size: count - pool.length } },
    ]);
    pool = pool.concat(more);
  }
  if (pool.length < count) {
    const generic = await Question.aggregate([
      { $match: { _id: { $nin: pool.map((p) => p._id) } } },
      { $sample: { size: count - pool.length } },
    ]);
    pool = pool.concat(generic);
  }
  return pool.map((q) => ({ text: q.text, category: q.category, idealPoints: q.idealPoints || [] }));
}

/* ---------- Answer evaluation ---------- */
export async function evaluateAnswer({ role, difficulty, question, answer, idealPoints, inputMode }) {
  if (llmEnabled()) {
    try {
      const data = await askJSON(
        'You are a fair but rigorous interviewer. Score candidate answers honestly and give specific, kind, actionable feedback.',
        `Role: ${role}
Difficulty: ${difficulty}
Question: ${question}
Key points a strong answer covers: ${(idealPoints || []).join('; ') || 'use your own judgement'}
Candidate answer${inputMode === 'voice' ? ' (speech-to-text transcript, ignore minor transcription errors)' : ''}:
"""${answer}"""

Score 0-100 on correctness, depth, structure and clarity. An empty or irrelevant answer scores under 15.
Return: {"score":number,"strengths":["..."],"improvements":["..."],"idealAnswer":"a concise model answer in 3-5 sentences"}`,
        900
      );
      return {
        score: clamp(data.score),
        strengths: arr(data.strengths),
        improvements: arr(data.improvements),
        idealAnswer: String(data.idealAnswer || ''),
      };
    } catch (err) {
      console.error('LLM evaluation failed, using heuristic:', err.message);
    }
  }
  return heuristicEvaluate(answer, idealPoints);
}

// Demo-mode scoring: keyword coverage + length. Not smart, but works offline.
function heuristicEvaluate(answer, idealPoints = []) {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const lower = answer.toLowerCase();
  const hits = idealPoints.filter((p) =>
    p.toLowerCase().split(/\W+/).filter((w) => w.length > 4).some((w) => lower.includes(w))
  );
  const coverage = idealPoints.length ? hits.length / idealPoints.length : 0.5;
  const lengthScore = Math.min(words.length / 80, 1);
  const score = words.length < 5 ? 5 : clamp(coverage * 65 + lengthScore * 35);
  return {
    score,
    strengths: hits.length ? [`You touched on: ${hits.slice(0, 2).join('; ')}`] : [],
    improvements: [
      ...idealPoints.filter((p) => !hits.includes(p)).slice(0, 2).map((p) => `Cover: ${p}`),
      ...(words.length < 40 ? ['Add more detail and a concrete example'] : []),
    ],
    idealAnswer: idealPoints.length
      ? `A strong answer covers: ${idealPoints.join('; ')}.`
      : 'Add an ANTHROPIC_API_KEY to get a model answer.',
  };
}

/* ---------- Session summary ---------- */
export async function summarizeSession({ role, questions, overallScore }) {
  if (llmEnabled()) {
    try {
      const data = await askJSON(
        'You are an interview coach writing a short end-of-session report.',
        `Role: ${role}. Overall score: ${overallScore}/100.
Per-question results:
${questions.map((q, i) => `${i + 1}. [${q.score}] ${q.text}`).join('\n')}
Write a 3-4 sentence summary naming the candidate's strongest area, the most important thing to improve, and one concrete next step.
Return: {"summary":"..."}`,
        400
      );
      if (data.summary) return String(data.summary);
    } catch (err) {
      console.error('LLM summary failed:', err.message);
    }
  }
  const best = [...questions].sort((a, b) => b.score - a.score)[0];
  const worst = [...questions].sort((a, b) => a.score - b.score)[0];
  return `You scored ${overallScore}/100. Strongest answer: "${best?.text}". Weakest: "${worst?.text}". Review the model answers below and retry this role to improve.`;
}
