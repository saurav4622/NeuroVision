import { useNavigate } from "react-router-dom";
import coverImage from "../../assets/cover-page.png";
import "./CoverPage.css";

const CoverPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  // Developer bypass for dashboards
  const handleDevBypass = async (role) => {
    let user;
    if (role === 'admin') {
      // Use real admin credentials for bypass
      const email = 'pauisaurav1234@gmail.com';
      const password = 'admin123';
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      try {
        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'admin' })
        });
        const data = await response.json();
        if (response.ok && data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/admin');
        } else {
          alert('Admin bypass failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Admin bypass failed: ' + err.message);
      }
    } else if (role === 'doctor') {
      user = { name: 'Dev Doctor', role: 'doctor', email: 'dev@doctor.com', doctorInfo: { specialty: 'Dev', hospital: 'Dev Hospital' } };
      localStorage.setItem('token', 'dev-bypass-token');
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/doctor');
    } else if (role === 'patient') {
      user = { name: 'Dev Patient', role: 'patient', email: 'dev@patient.com', patientInfo: { serial: 'PAT-DEV-0000' } };
      localStorage.setItem('token', 'dev-bypass-token');
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    }
  };

  return (
    <div className="cover-page">
      <div className="overlay"></div>

      <div className="content">
        <div className="left">
          <img src={coverImage} alt="Human Neuro Image" />
        </div>

        <div className="right">
          <h1>NeuroVision: AI-Driven MRI Analysis for Alzheimer's Detection</h1>
          <h2>Revolutionizing Neurological Insights with AI</h2>

          <div className="buttons">
            <button className="login-btn" onClick={handleLogin}>Login now</button>
            <button className="signup-btn" onClick={handleSignup}>Sign-up now</button>
          </div>
          <div className="dev-bypass-buttons" style={{ marginTop: 16 }}>
            <button style={{marginRight: 8}} onClick={() => handleDevBypass('admin')}>Dev Bypass: Admin</button>
            <button style={{marginRight: 8}} onClick={() => handleDevBypass('doctor')}>Dev Bypass: Doctor</button>
            <button onClick={() => handleDevBypass('patient')}>Dev Bypass: Patient</button>
          </div>

          <p>
            NeuroVision uses AI to analyze MRI scans and uncover early signs of Alzheimer’s—giving families and doctors a head start.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoverPage;
