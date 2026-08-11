const SEVERITY_PENALTY = {
  CRITICAL: 30,
  HIGH: 20,
  MEDIUM: 10,
  LOW: 5,
  INFO: 0,
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Computes security and quality scores from a combined findings list
 * (static + AI findings, already normalized to the same shape).
 */
function calculateScores(findings = []) {
  let securityScore = 100;
  let qualityScore = 100;

  for (const f of findings) {
    const penalty = SEVERITY_PENALTY[f.severity] ?? 0;
    if (f.category === 'Security') {
      securityScore -= penalty;
    } else {
      // Quality, Performance, Maintainability all affect the quality score
      qualityScore -= penalty;
    }
  }

  securityScore = clamp(Math.round(securityScore));
  qualityScore = clamp(Math.round(qualityScore));

  const overall = Math.min(securityScore, qualityScore);
  let riskLevel = 'LOW';
  if (overall < 50) riskLevel = 'CRITICAL';
  else if (overall < 75) riskLevel = 'HIGH';
  else if (overall < 90) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';

  return { securityScore, qualityScore, riskLevel };
}

function scoreLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'High Risk';
}

module.exports = { calculateScores, scoreLabel, SEVERITY_PENALTY };
