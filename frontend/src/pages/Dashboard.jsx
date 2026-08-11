import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScoreBadge from '../components/ScoreBadge';

export default function Dashboard() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/review');
        if (!cancelled) setReviews(res.data.reviews);
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
  }, []);

  const avg = (key) =>
    reviews.length ? Math.round(reviews.reduce((sum, r) => sum + r[key], 0) / reviews.length) : null;

  const avgSecurity = avg('securityScore');
  const avgQuality = avg('qualityScore');

  return (
    <div className="container">
      <h1 className="page-title">Welcome, {user?.fullName?.split(' ')[0]}</h1>
      <p className="page-subtitle">Here's an overview of your code reviews.</p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Loading dashboard…
        </div>
      ) : (
        <>
          <div className="grid-3">
            <div className="card stat-card">
              <div className="value">{reviews.length}</div>
              <div className="label">Total Reviews</div>
            </div>
            <div className="card stat-card">
              <div className="value">{avgSecurity ?? '—'}</div>
              <div className="label">Avg Security Score</div>
            </div>
            <div className="card stat-card">
              <div className="value">{avgQuality ?? '—'}</div>
              <div className="label">Avg Quality Score</div>
            </div>
          </div>

          <div className="card">
            <div className="space-between" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Recent Reviews</h3>
              <Link to="/review/new" className="btn">
                + New Review
              </Link>
            </div>

            {reviews.length === 0 ? (
              <div className="empty-state">
                No reviews yet. Upload or paste some code to get your first report.
              </div>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Language</th>
                    <th>Security</th>
                    <th>Quality</th>
                    <th>Risk</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.slice(0, 5).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link to={`/review/${r.id}`}>{r.fileName}</Link>
                      </td>
                      <td>{r.language}</td>
                      <td><ScoreBadge score={r.securityScore} showLabel={false} /></td>
                      <td><ScoreBadge score={r.qualityScore} showLabel={false} /></td>
                      <td className={`risk-${r.riskLevel}`}>{r.riskLevel}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
