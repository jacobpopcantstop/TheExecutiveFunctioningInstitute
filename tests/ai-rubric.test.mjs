import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const rubric = require('../netlify/functions/_ai_rubric.js');

test('clampScore bounds values between 0 and 100', () => {
  assert.equal(rubric.clampScore(-10), 0);
  assert.equal(rubric.clampScore(150), 100);
});

test('clampScore rounds valid numeric values', () => {
  assert.equal(rubric.clampScore(84.6), 85);
});

test('buildRubric returns capstone criteria with five weighted items', () => {
  const out = rubric.buildRubric('capstone', null);
  assert.equal(out.criteria.length, 5);
  assert.equal(out.criteria.reduce((sum, c) => sum + c.max, 0), 100);
});

test('buildRubric returns module criteria with four weighted items', () => {
  const out = rubric.buildRubric('module', '3');
  assert.equal(out.criteria.length, 4);
  assert.equal(out.criteria.reduce((sum, c) => sum + c.max, 0), 100);
});

test('parseJsonFromModel extracts JSON payload from noisy text', () => {
  const parsed = rubric.parseJsonFromModel('prefix {"score":81,"summary":"ok"} suffix');
  assert.equal(parsed.score, 81);
  assert.equal(parsed.summary, 'ok');
});

test('fallbackGrade always returns rubric-compliant structure', () => {
  const out = rubric.fallbackGrade({ evidence_url: 'https://example.com', notes: 'sample' });
  assert.equal(typeof out.score, 'number');
  assert.equal(typeof out.pass, 'boolean');
  assert.ok(Array.isArray(out.strengths));
  assert.ok(Array.isArray(out.improvements));
});
