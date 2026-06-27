import { useEffect, useState } from 'react';

function EntryDisclaimer({ onAccept }) {
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <div className="disclaimer-shell">
      <div className="disclaimer-panel">
        <h1>Welcome to SafeMap</h1>
        <p>Before entering, please review this community disclaimer.</p>
        <div className="disclaimer-copy">
          <p>SafeMap is a neighborhood safety and reporting platform. By continuing, you agree that all reports are shared responsibly, personal privacy is respected, false reports are prohibited, and emergency support should always be contacted through official channels first.</p>
          <p>Reports may be moderated. Community members should avoid speculating, naming individuals, or sharing unverified claims.</p>
          <p>The app may display community-sourced safety data and trends; this information is not a substitute for professional law enforcement advice.</p>
        </div>
        <div className="disclaimer-footer">
          <span>Please wait {secondsLeft} second{secondsLeft === 1 ? '' : 's'} before continuing.</span>
          <button type="button" disabled={secondsLeft > 0} onClick={onAccept}>Enter SafeMap</button>
        </div>
      </div>
    </div>
  );
}

export default EntryDisclaimer;
