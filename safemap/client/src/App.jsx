import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import MapView from './pages/MapView.jsx';
import ReportForm from './pages/ReportForm.jsx';
import ReportDetail from './pages/ReportDetail.jsx';
import PoliceDashboard from './pages/PoliceDashboard.jsx';
import Analytics from './pages/Analytics.jsx';
import Neighborhood from './pages/Neighborhood.jsx';
import Settings from './pages/Settings.jsx';
import Wanted from './pages/Wanted.jsx';
import BroadcastBanner from './components/BroadcastBanner.jsx';
import FooterDisclaimer from './components/FooterDisclaimer.jsx';
import EntryDisclaimer from './components/EntryDisclaimer.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

function App() {
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(() => localStorage.getItem('safemapDisclaimerAccepted') === 'true');

  if (!acceptedDisclaimer) {
    return <EntryDisclaimer onAccept={() => {
      localStorage.setItem('safemapDisclaimerAccepted', 'true');
      setAcceptedDisclaimer(true);
    }} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">SafeMap</div>
        <nav>
          <Link to="/">Map</Link>
          <Link to="/report">Report</Link>
          <Link to="/dashboard">Police</Link>
          <Link to="/analytics">Analytics</Link>
          <Link to="/neighborhood">Neighborhood</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/wanted">Wanted</Link>
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign Up</Link>
        </nav>
      </header>
      <BroadcastBanner />
      <main>
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/report" element={<ReportForm />} />
          <Route path="/report/:id" element={<ReportDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<PoliceDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/neighborhood" element={<Neighborhood />} />
          <Route path="/wanted" element={<Wanted />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <FooterDisclaimer />
    </div>
  );
}

export default App;
