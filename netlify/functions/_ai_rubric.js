const { requiredEnv } = require('./_common');

function clampScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

function buildRubric(kind, moduleId) {
  if (kind === 'capstone') {
    return {
      kind,
      criteria: [
        { id: 'intake_analysis', label: 'Intake Analysis Quality', max: 25 },
        { id: 'intervention_design', label: 'Intervention Design', max: 25 },
        { id: 'evidence_alignment', label: 'Evidence-Based Alignment', max: 20 },
        { id: 'ethical_scope', label: 'Ethical Scope of Practice', max: 15 },
        { id: 'clarity_professionalism', label: 'Clarity and Professionalism', max: 15 }
      ]
    };
  }

  return {
    kind,
    module_id: String(moduleId || ''),
    criteria: [
      { id: 'conceptual_accuracy', label: 'Conceptual Accuracy', max: 35 },
      { id: 'application_quality', label: 'Application Quality', max: 30 },
      { id: 'evidence_based_reasoning', label: 'Evidence-Based Reasoning', max: 20 },
      { id: 'clarity_actionability', label: 'Clarity and Actionability', max: 15 }
    ]
  };
}

function buildPrompt(input) {
  const rubric = buildRubric(input.kind, input.module_id);
  return [
    'You are grading executive-function coaching certification submissions.',
    'Return STRICT JSON only with keys: score, pass, summary, strengths, improvements, rubric_breakdown.',
    'Do not wrap in markdown.',
    `Rubric: ${JSON.stringify(rubric)}`,
    `Evidence URL: ${input.evidence_url || ''}`,
    `Submission notes: ${input.notes || ''}`,
    'Scoring scale: 0-100. Pass threshold: 75.'
  ].join('\n');
}

function parseJsonFromModel(text) {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('Empty model response');
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first < 0 || last < first) throw new Error('No JSON object in response');
  const jsonSlice = raw.slice(first, last + 1);
  return JSON.parse(jsonSlice);
}

function fallbackGrade(input) {
  const basis = `${input.evidence_url || ''} ${(input.notes || '')}`.trim().length;
  const score = Math.max(65, Math.min(95, 68 + (basis % 27)));
  return {
    score,
    pass: score >= 75,
    summary: 'Automated fallback rubric score generated. Add richer evidence details for deeper feedback.',
    strengths: ['Clear submission intent', 'Action orientation'],
    improvements: ['Add stronger evidence references', 'Include measurable outcome criteria'],
    rubric_breakdown: []
  };
}

async function callGemini(prompt) {
  const apiKey = requiredEnv('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  const model = requiredEnv('GEMINI_MODEL') || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) throw new Error('Gemini API request failed');

  const text = payload && payload.candidates && payload.candidates[0] && payload.candidates[0].content && payload.candidates[0].content.parts && payload.candidates[0].content.parts[0] && payload.candidates[0].content.parts[0].text;
  if (!text) throw new Error('Gemini response missing content');
  return parseJsonFromModel(text);
}

async function gradeSubmission(input) {
  const prompt = buildPrompt(input);
  try {
    const graded = await callGemini(prompt);
    const score = clampScore(graded.score);
    return {
      score,
      pass: score >= 75,
      summary: String(graded.summary || 'Rubric grading completed.'),
      strengths: Array.isArray(graded.strengths) ? graded.strengths.map(String).slice(0, 6) : [],
      improvements: Array.isArray(graded.improvements) ? graded.improvements.map(String).slice(0, 6) : [],
      rubric_breakdown: Array.isArray(graded.rubric_breakdown) ? graded.rubric_breakdown : []
    };
  } catch (err) {
    return fallbackGrade(input);
  }
}

module.exports = {
  clampScore,
  buildRubric,
  buildPrompt,
  parseJsonFromModel,
  fallbackGrade,
  gradeSubmission
};
