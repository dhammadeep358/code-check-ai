import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { extractErrorMessage } from '../services/api';
import ScoreBadge from '../components/ScoreBadge';
import FindingCard from '../components/FindingCard';

const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export default function ReviewReport() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/review/${id}`);
        if (!cancelled) setReview(res.data.review);
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="spinner" />
          Loading report…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-banner">{error}</div>
        <Link to="/history">Back to history</Link>
      </div>
    );
  }

  if (!review) return null;

  const findings = [...review.findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );
  const visibleFindings = filter === 'ALL' ? findings : findings.filter((f) => f.severity === filter);

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <div className="space-between" style={{ marginBottom: 4 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>{review.fileName}</h1>
        <span className={`risk-${review.riskLevel}`} style={{ fontWeight: 700 }}>
          {review.riskLevel} RISK
        </span>
      </div>
      <p className="page-subtitle">
        {review.language} · reviewed {new Date(review.createdAt).toLocaleString()}
      </p>

      {review.aiStatus === 'unavailable' && (
        <div className="error-banner">
          AI analysis was unavailable for this review. Results below are from the deterministic static scanner only.
        </div>
      )}

      <div className="grid-3">
        <div className="card stat-card">
          <ScoreBadge score={review.securityScore} showLabel={false} />
          <div className="label" style={{ marginTop: 8 }}>Security Score</div>
        </div>
        <div className="card stat-card">
          <ScoreBadge score={review.qualityScore} showLabel={false} />
          <div className="label" style={{ marginTop: 8 }}>Quality Score</div>
        </div>
        <div className="card stat-card">
          <div className="value" style={{ fontSize: '1.4rem' }}>{findings.length}</div>
          <div className="label">Total Findings</div>
        </div>
      </div>

      {review.summary && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Summary</h3>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>{review.summary}</p>

          {review.positivePoints?.length > 0 && (
            <>
              <h4>What's working well</h4>
              <ul style={{ color: 'var(--text-dim)' }}>
                {review.positivePoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </>
          )}

          {review.nextSteps?.length > 0 && (
            <>
              <h4>Next steps</h4>
              <ul style={{ color: 'var(--text-dim)' }}>
                {review.nextSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="space-between" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Findings</h3>
      </div>

      <div className="pill-select">
        {['ALL', ...SEVERITY_ORDER].map((s) => (
          <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      {visibleFindings.length === 0 ? (
        <div className="card empty-state">No findings in this category. 🎉</div>
      ) : (
        visibleFindings.map((f, i) => <FindingCard key={i} finding={f} />)
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <button className="link-btn" onClick={() => setShowSource((s) => !s)}>
          {showSource ? 'Hide source code' : 'Show source code'}
        </button>
        {showSource && <pre className="code-fix" style={{ marginTop: 12 }}>{review.sourceCode}</pre>}
      </div>
    </div>
  );
}
