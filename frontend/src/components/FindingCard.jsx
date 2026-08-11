export default function FindingCard({ finding }) {
  return (
    <div className={`finding-card sev-${finding.severity}`}>
      <div className="finding-header">
        <h4>{finding.title}</h4>
        <span className={`badge sev-${finding.severity}`}>{finding.severity}</span>
      </div>
      <div className="finding-meta">
        {finding.category}
        {finding.line ? ` · line ${finding.line}` : ''}
        {' · '}
        {finding.source === 'ai' ? 'AI-detected' : 'Static scan'}
      </div>
      {finding.explanation && (
        <div className="finding-section">
          <strong>Why it matters</strong>
          {finding.explanation}
        </div>
      )}
      {finding.recommendation && (
        <div className="finding-section">
          <strong>Recommendation</strong>
          {finding.recommendation}
        </div>
      )}
      {finding.suggestedFix && (
        <div className="finding-section">
          <strong>Suggested fix</strong>
          <pre className="code-fix">{finding.suggestedFix}</pre>
        </div>
      )}
    </div>
  );
}
