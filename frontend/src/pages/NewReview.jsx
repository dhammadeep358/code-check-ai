import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { extractErrorMessage } from '../services/api';

const LANGUAGES = ['auto', 'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp', 'go', 'ruby', 'php'];

export default function NewReview() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('paste'); // 'paste' | 'upload'
  const [language, setLanguage] = useState('auto');
  const [fileName, setFileName] = useState('');
  const [code, setCode] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function handleFileSelect(selected) {
    if (!selected) return;
    setFile(selected);
    setFileName(selected.name);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'paste' && !code.trim()) {
      setError('Please paste some code to review.');
      return;
    }
    if (mode === 'upload' && !file) {
      setError('Please choose a file to upload.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (mode === 'upload') {
        const formData = new FormData();
        formData.append('codeFile', file);
        if (language !== 'auto') formData.append('language', language);
        res = await api.post('/review/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/review/code', {
          language: language === 'auto' ? undefined : language,
          fileName: fileName || 'pasted-code.txt',
          code,
        });
      }
      navigate(`/review/${res.data.review.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <h1 className="page-title">New Review</h1>
      <p className="page-subtitle">Upload a source file or paste code to get a security &amp; quality report.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="pill-select">
        <button type="button" className={mode === 'paste' ? 'active' : ''} onClick={() => setMode('paste')}>
          Paste Code
        </button>
        <button type="button" className={mode === 'upload' ? 'active' : ''} onClick={() => setMode('upload')}>
          Upload File
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Language (optional — auto-detected if left as "auto")</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {mode === 'paste' ? (
          <>
            <div className="field">
              <label>File name (optional, for labeling)</label>
              <input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="example.js" />
            </div>
            <div className="field">
              <label>Code</label>
              <textarea
                className="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your source code here…"
                spellCheck={false}
              />
            </div>
          </>
        ) : (
          <div className="field">
            <label>Source file</label>
            <div
              className={`dropzone ${dragOver ? 'dragover' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFileSelect(e.dataTransfer.files?.[0]);
              }}
            >
              {file ? (
                <div>Selected: <strong>{file.name}</strong></div>
              ) : (
                <div>Click to browse or drag a source file here (max 2MB)</div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
            </div>
          </div>
        )}

        <button className="btn full" type="submit" disabled={loading}>
          {loading ? 'Analyzing…' : 'Review Code'}
        </button>

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: 12, fontSize: '0.85rem' }}>
            Running static checks and contacting the AI model — this can take a few seconds.
          </p>
        )}
      </form>
    </div>
  );
}
