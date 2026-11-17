import 'dotenv/config';
import mongoose from 'mongoose';
import Question from '../models/Question.js';

const Q = (role, difficulty, category, text, idealPoints) => ({ role, difficulty, category, text, idealPoints, source: 'seed' });

const data = [
  Q('MERN Stack Developer', 'easy', 'technical', 'What is the difference between state and props in React?', ['props are read-only inputs passed from parent', 'state is local and mutable via setState/useState', 'state changes trigger re-render']),
  Q('MERN Stack Developer', 'medium', 'technical', 'Explain how JWT authentication works in a MERN application.', ['server signs token after login', 'client stores token and sends in Authorization header', 'middleware verifies signature and expiry', 'tradeoffs of localStorage vs httpOnly cookies']),
  Q('MERN Stack Developer', 'medium', 'technical', 'What is the event loop in Node.js and why does it matter?', ['single-threaded non-blocking I/O', 'callback queue and microtasks', 'libuv thread pool for heavy work', 'avoid blocking the loop with CPU-bound tasks']),
  Q('MERN Stack Developer', 'hard', 'technical', 'How would you design pagination and indexing for a MongoDB collection with 10 million documents?', ['cursor/range based pagination over skip', 'compound indexes matching query and sort', 'use explain() to verify index usage', 'projection and limiting returned fields']),
  Q('MERN Stack Developer', 'medium', 'technical', 'What causes unnecessary re-renders in React and how do you prevent them?', ['new object/function references each render', 'React.memo, useMemo, useCallback', 'state placed too high in the tree', 'keys and list rendering']),
  Q('Frontend Developer', 'easy', 'technical', 'Explain the CSS box model.', ['content, padding, border, margin', 'box-sizing border-box vs content-box', 'margin collapsing']),
  Q('Frontend Developer', 'medium', 'technical', 'What is the difference between var, let and const, and what is hoisting?', ['function vs block scope', 'temporal dead zone', 'const prevents reassignment not mutation']),
  Q('Frontend Developer', 'hard', 'technical', 'How would you improve the load performance of a slow React web app?', ['code splitting and lazy loading', 'image optimisation and caching', 'measure with Lighthouse / Web Vitals', 'reduce bundle size and re-renders']),
  Q('Backend Developer', 'easy', 'technical', 'What is the difference between PUT and PATCH in REST?', ['PUT replaces the whole resource', 'PATCH updates part of it', 'idempotency']),
  Q('Backend Developer', 'medium', 'technical', 'What are database indexes and what is the cost of adding too many?', ['speed up reads via B-tree lookups', 'slower writes and more storage', 'choose indexes by query patterns']),
  Q('Backend Developer', 'hard', 'technical', 'How would you design a rate limiter for an API?', ['token bucket or sliding window', 'store counters in Redis', 'per-user/IP keys and HTTP 429', 'distributed consistency']),
  Q('Data Analyst', 'easy', 'technical', 'What is the difference between INNER JOIN and LEFT JOIN?', ['inner returns only matching rows', 'left keeps all left rows with NULLs', 'example use case']),
  Q('Data Analyst', 'medium', 'technical', 'How do you handle missing values in a dataset?', ['understand why data is missing', 'drop, impute mean/median/mode, or model-based', 'impact on bias', 'document the choice']),
  Q('Machine Learning Engineer', 'medium', 'technical', 'Explain overfitting and three ways to reduce it.', ['model fits noise, poor generalisation', 'regularisation, dropout, early stopping', 'more data or augmentation', 'cross-validation to detect it']),
  Q('Machine Learning Engineer', 'hard', 'technical', 'How do you choose evaluation metrics for an imbalanced classification problem?', ['accuracy is misleading', 'precision, recall, F1, PR-AUC', 'business cost of false positives vs negatives', 'stratified splits']),
  Q('Software Engineer', 'easy', 'technical', 'What is the difference between an array and a linked list?', ['contiguous memory vs nodes with pointers', 'O(1) index access vs O(n)', 'insertion/deletion cost']),
  Q('Software Engineer', 'medium', 'technical', 'Explain time and space complexity with an example of optimising a nested loop.', ['Big-O notation', 'use hash map to reduce O(n^2) to O(n)', 'space-time tradeoff']),
  Q('Software Engineer', 'medium', 'technical', 'What are the SOLID principles? Give one example.', ['single responsibility, open/closed, Liskov, interface segregation, dependency inversion', 'one concrete example', 'why they help maintainability']),
  Q('HR / Behavioral', 'easy', 'behavioral', 'Tell me about yourself.', ['brief background and education', 'key projects and skills', 'why this role', 'keep it under two minutes']),
  Q('HR / Behavioral', 'medium', 'behavioral', 'Describe a time you faced a conflict in a team and how you resolved it.', ['clear situation and your role', 'actions you took, listening and communication', 'measurable outcome', 'what you learned']),
  Q('HR / Behavioral', 'medium', 'behavioral', 'Tell me about a project you are most proud of and the biggest challenge in it.', ['context and your contribution', 'specific technical or teamwork challenge', 'how you solved it', 'result and learning']),
  Q('HR / Behavioral', 'hard', 'behavioral', 'Describe a failure and what you changed afterwards.', ['honest ownership', 'root cause analysis', 'concrete change in behaviour', 'positive outcome later']),
  Q('HR / Behavioral', 'easy', 'behavioral', 'Where do you see yourself in five years?', ['realistic growth goals', 'link to the company and role', 'learning mindset']),
];

await mongoose.connect(process.env.MONGO_URI);
await Question.deleteMany({ source: 'seed' });
await Question.insertMany(data);
console.log(`Seeded ${data.length} questions`);
await mongoose.disconnect();
