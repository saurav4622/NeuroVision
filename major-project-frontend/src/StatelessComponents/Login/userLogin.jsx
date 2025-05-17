import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Ballpit from "../../StatefullComponents/BallPitBg/BallPit.jsx";
import Button from "../../StatefullComponents/ButtonLogin/LoginButton.jsx";
import "./login.css";

const UserLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");    // Validation
    if (!email && !password) {
      setError("Please enter your email and password");
      return;
    }
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, role })
      });          const data = await response.json();      if (!response.ok) {
        // Handle different error cases
        if (response.status === 401) {          if (data.error === "Invalid password") {
            const attempts = passwordAttempts + 1;
            setPasswordAttempts(attempts);
            if (attempts >= 3) {
              setError("Too many failed attempts. Please reset your password.");
            } else {
              setError(`Invalid password - Attempt ${attempts} of 3`);
            }
          } else {
            setError(role === 'admin' 
              ? 'Access Denied - Administrative privileges required'
              : `${role === 'doctor' ? 'Doctor' : 'User'} not registered. Please sign up first.`
            );
          }
          return;
        }
        if (response.status === 403) {
          setError(`Invalid credentials for ${role} access. Please check your role selection.`);
          return;
        }
        setError(data.error || 'Login failed. Please check your credentials.');
        return;
      }      // Verify role matches
      if (data.user.role !== role) {
        setError(role === 'admin'
          ? 'Access Denied - Administrative privileges required'
          : `Access Denied - This account is registered as a ${data.user.role}, not a ${role}`
        );
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      switch (data.user.role) {
        case "admin":
          navigate('/admin');
          break;
        case "doctor":
          navigate('/doctor');
          break;
        case "patient":
          navigate('/dashboard');
          break;
        default:
          navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="login-page">
      <Aurora />
      <div className="login-card">
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="animated-input"
          />
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="animated-input"
            />
            <button 
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="role-select animated-input"
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit">Login</button>
          
          {/* Developer bypass button - TO BE REMOVED IN PRODUCTION */}
          <button 
            type="button" 
            onClick={handleDeveloperAccess}
            className="developer-button"
          >
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
