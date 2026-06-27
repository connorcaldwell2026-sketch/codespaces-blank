import { useEffect, useMemo, useState } from 'react';
import AIClassifierBadge from '../components/AIClassifierBadge.jsx';

const crimeTypes = ['Theft', 'Assault', 'Robbery', 'Vandalism', 'Suspicious Activity', 'Other'];

function ReportForm() {
  const [description, setDescription] = useState('');
  const [regionId, setRegionId] = useState('us');
  const [customRegion, setCustomRegion] = useState('');
  const [crimeType, setCrimeType] = useState('Other');
  const [aiData, setAiData] = useState(null);
  const [tags, setTags] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    if (!description) return;
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description })
        });
        const result = await res.json();
        setAiData(result);
        if (result.suggestedCrimeType) setCrimeType(result.suggestedCrimeType);
        if (result.suggestedTags) setTags(result.suggestedTags.join(', '));
      } catch (error) {
        console.error(error);
      }
    }, 900);
    return () => clearTimeout(timeout);
  }, [description]);

  const severityLabel = useMemo(() => {
    if (!aiData) return null;
    const level = aiData.severityScore;
    const risk = level >= 8 ? 'High Risk' : level >= 5 ? 'Medium Risk' : 'Low Risk';
    return `⚠️ Severity ${level} — ${risk}`;
  }, [aiData]);

  const lowConfidence = aiData?.confidence === 'low' || aiData?.isFalseReportRisk;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      description,
      crimeType,
      regionId: regionId === 'other' ? customRegion || 'other' : regionId,
      suggestedTags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      aiFlagged: lowConfidence
    };
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: 'citizen-1' })
    });
    if (response.ok) {
      setSubmitStatus('Report submitted successfully.');
    } else {
      setSubmitStatus('Failed to submit report.');
    }
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>Report an Incident</h2>
        <p className="muted">Provide a concise description and pick the correct region. Reports flagged as low-confidence will be reviewed by moderators.</p>
        <form className="report-form" onSubmit={handleSubmit}>
          <label>
            Region
            <select value={regionId} onChange={(e) => setRegionId(e.target.value)}>
              <option value="us">United States (US)</option>
              <option value="ca">Canada</option>
              <option value="other">Other / Manual</option>
            </select>
          </label>
          {regionId === 'other' && (
            <label>
              Custom Region ID
              <input value={customRegion} onChange={(e) => setCustomRegion(e.target.value)} />
            </label>
          )}
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
          </label>
          <label>
            Crime Type
            <select value={crimeType} onChange={(e) => setCrimeType(e.target.value)}>
              {crimeTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label>
            Suggested Tags
            <input value={tags} onChange={(e) => setTags(e.target.value)} />
          </label>
          {aiData && <AIClassifierBadge aiData={aiData} />}
          {lowConfidence && <div className="warning">This report is low-confidence or flagged as risk and will require extra review.</div>}
          <button type="submit">Submit Report</button>
          {submitStatus && <p className="status-message">{submitStatus}</p>}
        </form>
      </section>
    </div>
  );
}

export default ReportForm;
