import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Login/login.css";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;
  const email = location.state?.email;
  const selectedRole = location.state?.role; // role selected during signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResendMsg("");
    
    // Validate inputs before sending
    if (!otp) {
      setError("Please enter the OTP sent to your email.");
      return;
    }
    
    if (!userId) {
      setError("User ID is missing. Please try signing up again.");
      return;
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
      
      console.log("Sending OTP verification request:", { userId, otp: otp.substring(0, 2) + "***" });
      
      const response = await fetch(`${apiUrl}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp })
      });
      
      const data = await response.json();
      console.log("OTP verification response:", { status: response.status, success: response.ok });
      
      if (response.ok) {
        setSuccess("Email verified! Redirecting...");
        
        // Store authentication data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => {
          // Use the role from the server response as it's more reliable
          const userRole = data.user?.role || selectedRole;
          if (userRole === 'doctor') navigate('/doctor');
          else if (userRole === 'patient') navigate('/dashboard');
          else if (userRole === 'admin') navigate('/admin');
          else navigate('/');
        }, 1500);
      } else {
        // Handle specific error messages
        const errorMessage = data.error || data.message || data.detail || "Invalid OTP";
        console.error("OTP verification failed:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResendMsg("");
    try {
      const apiUrl = import.meta.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (response.ok) {
        setResendMsg("OTP resent to your email.");
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  if (!userId) {
    return <div>No user found. Please sign up again.</div>;
  }
  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Verify Your Email</h2>
        {email && (
          <div className="info-text" style={{ marginBottom: '20px' }}>
            We've sent a verification code to <strong>{email}</strong>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
            className="animated-input"
          />
          <div className="button-container">
            <button type="submit" className="animated-btn">Verify</button>
            <button 
              style={{marginTop: 10}} 
              onClick={handleResend} 
              type="button" 
              className="animated-btn secondary-btn"
            >
              Resend OTP
            </button>
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="back-to-login"
            >
              Back to Login
            </button>
          </div>
        </form>
        {error && <div className="field-error">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        {resendMsg && <div className="success-message">{resendMsg}</div>}
      </div>
    </div>
  );
};

export default VerifyOtp;
