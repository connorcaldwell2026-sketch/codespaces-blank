import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const authHeaders = () => {
  const token = localStorage.getItem('safemap_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ReportDetail = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [summary, setSummary] = useState('');
  const [witnessToken, setWitnessToken] = useState('');
  const [busy, setBusy] = useState(false);

  const userId = localStorage.getItem('safemap_user') || 'community-user';

  const loadReport = async () => {
    try {
      const res = await fetch(`/api/reports/${id}`);
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) loadReport();
  }, [id]);

  const addComment = async () => {
    if (!commentText.trim()) return;
    setBusy(true);
    await fetch(`/api/reports/${id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ userId, text: commentText })
    });
    setCommentText('');
    await loadReport();
    setBusy(false);
  };

  const addInternalNote = async () => {
    if (!noteText.trim()) return;
    setBusy(true);
    await fetch(`/api/reports/${id}/note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ authorId: userId, text: noteText })
    });
    setNoteText('');
    await loadReport();
    setBusy(false);
  };

  const assignMe = async () => {
    setBusy(true);
    await fetch(`/api/reports/${id}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ officerId: userId })
    });
    await loadReport();
    setBusy(false);
  };

  const generateWitnessToken = async () => {
    setBusy(true);
    const res = await fetch(`/api/reports/${id}/witness-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      }
    });
    const data = await res.json();
    setWitnessToken(data.witnessToken);
    setBusy(false);
  };

  const summarizeReport = async () => {
    if (!report) return;
    setBusy(true);
    const text = `${report.description} ${report.additionalDetails || ''}`;
    const res = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ text, maxTokens: 250 })
    });
    const data = await res.json();
    setSummary(data.summary || 'Unable to generate summary.');
    setBusy(false);
  };

  if (!report) {
    return <div className="page-shell"><h2>Loading report...</h2></div>;
  }

  return (
    <div className="page-shell report-detail-page">
      <h2>Report Detail</h2>
      <section className="report-detail-card">
        <div><strong>Crime</strong>: {report.crimeType || 'Unknown'}</div>
        <div><strong>Status</strong>: {report.status}</div>
        <div><strong>Severity</strong>: {report.severity}</div>
        <div><strong>Verified</strong>: {report.verified ? 'Yes' : 'No'}</div>
        <div><strong>Assigned To</strong>: {report.assignedTo || 'Not assigned'}</div>
        <div><strong>Location</strong>: {report.address || 'GPS coordinates available'}</div>
        <div><strong>Submitted</strong>: {new Date(report.createdAt).toLocaleString()}</div>
        <p>{report.description}</p>
        {report.additionalDetails && (
          <p><strong>Details:</strong> {report.additionalDetails}</p>
        )}
        {report.mediaUrls?.length > 0 && (
          <div className="media-list">
            <strong>Media</strong>:
            <ul>
              {report.mediaUrls.map((url) => (
                <li key={url}><a href={url} target="_blank" rel="noreferrer">Open media</a></li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="report-actions">
        <button onClick={assignMe} disabled={busy || report.status === 'Assigned'}>Assign to Me</button>
        <button onClick={summarizeReport} disabled={busy}>AI Summarize</button>
        <button onClick={generateWitnessToken} disabled={busy}>Generate Witness Token</button>
      </section>

      {witnessToken && (
        <div className="witness-token">
          <strong>Witness Token</strong>: <code>{witnessToken}</code>
        </div>
      )}

      {summary && (
        <section className="ai-summary">
          <h3>AI Summary</h3>
          <p>{summary}</p>
        </section>
      )}

      <section className="comments-section">
        <h3>Community Comments</h3>
        <div className="comment-form">
          <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a community observation..." />
          <button onClick={addComment} disabled={busy || !commentText.trim()}>Submit Comment</button>
        </div>
        <div className="comment-list">
          {report.comments?.length ? report.comments.map((comment) => (
            <div key={comment._id || comment.id} className="comment-card">
              <div><strong>{comment.userId || 'User'}</strong> • {new Date(comment.createdAt).toLocaleString()}</div>
              <p>{comment.text}</p>
            </div>
          )) : <p>No comments yet.</p>}
        </div>
      </section>

      <section className="notes-section">
        <h3>Internal Notes</h3>
        <div className="note-form">
          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a response note or officer action note..." />
          <button onClick={addInternalNote} disabled={busy || !noteText.trim()}>Save Note</button>
        </div>
        <div className="note-list">
          {report.internalNotes?.length ? report.internalNotes.map((note, index) => (
            <div key={`note-${index}`} className="note-card">
              <div><strong>{note.authorId || 'Staff'}</strong> • {new Date(note.createdAt).toLocaleString()}</div>
              <p>{note.text}</p>
            </div>
          )) : <p>No internal notes yet.</p>}
        </div>
      </section>
    </div>
  );
};

export default ReportDetail;
