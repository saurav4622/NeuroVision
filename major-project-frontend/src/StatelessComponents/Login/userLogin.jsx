import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Ballpit from "../../StatefullComponents/BallPitBg/BallPit.jsx";
import Button from "../../StatefullComponents/ButtonLogin/LoginButton.jsx";
import { useAuth } from "../../utils/authHelpers";
import "./login.css";

const UserLogin = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRememberMeChecked, setIsRememberMeChecked] = useState(false);
  
  useEffect(() => {
    // Load remembered email and role when component mounts
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedRole = localStorage.getItem('rememberedRole');
    
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setIsRememberMeChecked(true);
    }
    
    if (rememberedRole) {
      setRole(rememberedRole);
    }
    
    // Check if user is already logged in
    const { token, user } = auth.getAuthData();
    
    if (token && user && user.role) {
      console.log('User already logged in. Redirecting to appropriate dashboard...');
      // Redirect to appropriate dashboard based on user role
      auth.redirectBasedOnRole(user.role);
    }
  }, [navigate, auth]);
    const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // Show loading state
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
    }    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('Using API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, role })
      });
      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response:', data);if (!response.ok) {
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
      }      // Store authentication data using auth helper
      auth.setAuthData(data.token, data.user);
      
      // Save remembered info if remember me is checked
      if (isRememberMeChecked) {
        auth.setRememberMe(email, role);
      }      // Show success message with patient ID if available
      if (data.user.role === 'patient' && data.user.patientInfo && data.user.patientInfo.serial) {
        setError("");        // Show a more prominent message with the patient ID 
        setMessage(`Login successful! Your Patient ID: ${data.user.patientInfo.serial}`);
        setIsLoading(false); // Stop loading to show the ID clearly
        
        // Delay redirect to show the patient ID for longer time
        setTimeout(() => {
          console.log(`Login successful - Redirecting to ${data.user.role} dashboard`);
          auth.redirectBasedOnRole(data.user.role);
        }, 3000); // Increased from 2000ms to 3000ms to give more time to see ID
        
        return;
      }
      
      console.log(`Login successful - Redirecting to ${data.user.role} dashboard`);      // Redirect based on role using auth helper
      const redirected = auth.redirectBasedOnRole(data.user.role);
      if (!redirected) {
        console.error("Unknown role:", data.user.role);
        navigate('/login');
      }    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };  // No developer access in production

  return (
    <div className="login-page">
      <Ballpit
        count={200}
        gravity={0.7}
        friction={0.8}
        wallBounce={0.95}
        followCursor={true}
        colors={[0x1a2980, 0x26d0ce, 0xffffff]}
        style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0}}
      />
      <div className="login-card animated-card" style={{zIndex: 2, position: 'relative'}}>
        <h2 className="animated-text">Login</h2>
        {error && <div className="error-message animated-error">{error}</div>}        {message && (
          <div className={`success-message animated-success ${message.includes('Patient ID:') ? 'patient-id-message' : ''}`}>
            {message.includes('Patient ID:') ? (
              <>
                <span>Login successful!</span>
                <div style={{margin: '10px 0 5px'}}>Your Patient ID:</div>
                <strong>{message.split('Patient ID:')[1].trim()}</strong>
              </>
            ) : (
              message
            )}
          </div>
        )}
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
            />            <button 
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} opacity={0.8} /> : <Eye size={18} opacity={0.8} />}
            </button></div>
          
          <select 
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setError("");
            }}
            className="role-select animated-input"
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
            <div className="login-options">
            <div className="remember-me">
              <input 
                type="checkbox" 
                id="rememberMe"
                checked={isRememberMeChecked}
                onChange={(e) => {
                  setIsRememberMeChecked(e.target.checked);
                  if (e.target.checked) {
                    auth.setRememberMe(email, role);
                  } else {
                    auth.clearRememberMe();
                  }
                }}
              />
              <label htmlFor="rememberMe">Remember Me</label>
            </div>
            <div className="forgot-password">
              <span onClick={() => navigate('/forgot-password')}>Forgot Password?</span>
            </div>
          </div>          <div className="login-btn-container">
            <Button type="submit" isLoading={isLoading} />
          </div>
          
          <div className="signup-link">
            <p>Don't have an account? <span onClick={() => navigate('/signup')}>Sign Up</span></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserLogin;
