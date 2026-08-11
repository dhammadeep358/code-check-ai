import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractErrorMessage } from '../services/api';
import ScoreBadge from '../components/ScoreBadge';

export default function History() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/review');
      setReviews(res.data.reviews);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/review/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">Review History</h1>
      <p className="page-subtitle">All your past code reviews, saved to your account.</p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Loading history…
        </div>
      ) : reviews.length === 0 ? (
        <div className="card empty-state">
          No reviews yet. <Link to="/review/new">Start your first review →</Link>
        </div>
      ) : (
        <div className="card">
          <table className="history-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Language</th>
                <th>Security</th>
                <th>Quality</th>
                <th>Risk</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/review/${r.id}`}>{r.fileName}</Link>
                  </td>
                  <td>{r.language}</td>
                  <td><ScoreBadge score={r.securityScore} showLabel={false} /></td>
                  <td><ScoreBadge score={r.qualityScore} showLabel={false} /></td>
                  <td className={`risk-${r.riskLevel}`}>{r.riskLevel}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="link-btn"
                      style={{ color: 'var(--red)' }}
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                    >
                      {deletingId === r.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
