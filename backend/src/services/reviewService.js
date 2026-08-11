const Review = require('../models/Review');
const { runStaticAnalysis } = require('./staticAnalyzer');
const { generateCodeReview } = require('./aiService');
const { calculateScores } = require('./scoringService');

const MAX_CODE_LENGTH = 200000; // ~200KB of text, generous for a review tool

function detectLanguageFromFileName(fileName = '') {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java', c: 'c', cpp: 'cpp', cs: 'csharp',
    go: 'go', rb: 'ruby', php: 'php', html: 'html', css: 'css',
    json: 'json', yml: 'yaml', yaml: 'yaml', sql: 'sql', sh: 'bash',
    kt: 'kotlin', swift: 'swift', rs: 'rust', txt: 'text', md: 'markdown',
  };
  return map[ext] || 'text';
}

/**
 * Core pipeline shared by both the upload and pasted-code endpoints.
 */
async function performReview({ userId, fileName, language, code }) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    const err = new Error('No source code provided');
    err.statusCode = 400;
    throw err;
  }
  if (code.length > MAX_CODE_LENGTH) {
    const err = new Error('Source code is too large to review');
    err.statusCode = 400;
    throw err;
  }

  const resolvedLanguage = language || detectLanguageFromFileName(fileName);

  // 1. Deterministic static/security scan (always runs, never fails the request)
  const staticFindings = runStaticAnalysis(code);

  // 2. AI review (best-effort; failure degrades gracefully)
  const aiResult = await generateCodeReview({
    language: resolvedLanguage,
    fileName,
    code,
    staticFindings,
  });

  let combinedFindings = [...staticFindings];
  let summary = '';
  let positivePoints = [];
  let nextSteps = [];
  let aiStatus = 'ok';

  if (aiResult.ok) {
    combinedFindings = [...staticFindings, ...aiResult.data.findings];
    summary = aiResult.data.summary;
    positivePoints = aiResult.data.positivePoints;
    nextSteps = aiResult.data.nextSteps;
  } else {
    aiStatus = 'unavailable';
    summary = `AI analysis was unavailable (${aiResult.reason}). Showing deterministic static-scan results only.`;
    nextSteps = ['Verify AI provider configuration and re-run the review to get AI-generated recommendations.'];
  }

  // 3. Scoring
  const { securityScore, qualityScore, riskLevel } = calculateScores(combinedFindings);

  // 4. Persist
  const review = await Review.create({
    userId,
    fileName: fileName || 'pasted-code.txt',
    language: resolvedLanguage,
    sourceCode: code,
    securityScore,
    qualityScore,
    riskLevel,
    summary,
    findings: combinedFindings,
    positivePoints,
    nextSteps,
    aiStatus,
  });

  return review;
}

module.exports = { performReview, detectLanguageFromFileName };
