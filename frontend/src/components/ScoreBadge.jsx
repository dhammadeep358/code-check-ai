function scoreClass(score) {
  if (score >= 90) return 'score-green';
  if (score >= 75) return 'score-yellow';
  if (score >= 50) return 'score-orange';
  return 'score-red';
}

function scoreLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'High Risk';
}

export default function ScoreBadge({ score, showLabel = true }) {
  return (
    <span className={`score-badge ${scoreClass(score)}`}>
      {score}
      {showLabel ? ` · ${scoreLabel(score)}` : ''}
    </span>
  );
}
