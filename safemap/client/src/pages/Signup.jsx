import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regionId, setRegionId] = useState('');
  const [precinct, setPrecinct] = useState('');
  const [role, setRole] = useState('citizen');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!agree) return setError('You must agree to the community terms before creating your account.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, regionId, precinct, role, password })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Signup failed');
      localStorage.setItem('safemap_token', data.token);
      navigate('/');
    } catch (err) {
      setError('Signup error');
    }
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>Create your SafeMap account</h2>
        <p className="muted">Provide community credentials and local info so your account can receive relevant alerts and collaborate safely.</p>
        <form onSubmit={submit} className="signup-form">
          <label>
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </label>
          <label>
            Email address
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          </label>
          <label>
            Phone number
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
          </label>
          <label>
            Region
            <input value={regionId} onChange={(e) => setRegionId(e.target.value)} placeholder="City, state or region" />
          </label>
          <label>
            Precinct / neighborhood
            <input value={precinct} onChange={(e) => setPrecinct(e.target.value)} placeholder="Downtown patrol area" />
          </label>
          <label>
            Account type
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="citizen">Citizen</option>
              <option value="police">Community safety partner</option>
            </select>
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" />
          </label>
          <label>
            Confirm password
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
          </label>
          <label className="checkbox-field">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I agree to SafeMap's community usage policy and understand that false reports are prohibited.
          </label>
          <button type="submit">Create Account</button>
          {error && <div className="status-message error">{error}</div>}
        </form>
      </section>
    </div>
  );
}

export default Signup;
