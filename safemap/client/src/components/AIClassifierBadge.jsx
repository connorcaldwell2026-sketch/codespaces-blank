function AIClassifierBadge({ aiData }) {
  if (!aiData) return null;
  return (
    <div className="ai-badge">
      <div><strong>AI Suggested Type:</strong> {aiData.suggestedCrimeType}</div>
      <div><strong>Severity:</strong> {aiData.severityScore}</div>
      <div><strong>Confidence:</strong> {aiData.confidence}</div>
      <div><strong>Tags:</strong> {aiData.suggestedTags?.join(', ')}</div>
    </div>
  );
}

export default AIClassifierBadge;
