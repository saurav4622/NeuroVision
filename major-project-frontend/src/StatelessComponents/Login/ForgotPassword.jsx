import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Ballpit from "../../StatefullComponents/BallPitBg/BallPit.jsx";
import "./login.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("request"); // "verify", "request", or "reset"
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationData, setVerificationData] = useState({
    dateOfBirth: "",
    emailConfirm: "",
  });

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    if (!email) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/password/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        setError(data.error || 'Failed to request password reset');
        return;
      }

      if (data.status === 'success') {
        setMessage(data.message || "Password reset link has been sent to your email.");
        setStep("reset");
        // In development, we get the token directly
        if (data.resetToken) {
          setResetToken(data.resetToken);
        }
      } else {
        setError(data.error || 'Failed to process password reset request');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!resetToken) {
      setError("Invalid reset token");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setMessage('Password has been successfully reset');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again later.');
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !verificationData.emailConfirm) {
      setError("Please enter your email address twice for confirmation");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/password/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          emailConfirm: verificationData.emailConfirm,
          dateOfBirth: verificationData.dateOfBirth
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      if (data.verified) {
        setMessage('Identity verified successfully');
        setStep("request");
      }
    } catch (err) {
      setError('An error occurred during verification');
    }
  };

  return (
    <div className="login-page">
      <Ballpit
        count={150}
        gravity={0.7}
        friction={0.8}
        wallBounce={0.95}
        followCursor={true}
        colors={[0x1a2980, 0x26d0ce, 0xffffff]}
        style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0}}
      />
      <div className="login-card animated-card">
        <h2 className="animated-text">
          {step === "verify" 
            ? "Verify Identity" 
            : step === "request" 
              ? "Forgot Password" 
              : "Reset Password"}
        </h2>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-container"><p className="error-message">{error}</p></div>}

        {step === "verify" ? (
          <form onSubmit={handleVerification}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="animated-input"
            />
            <input
              type="email"
              placeholder="Confirm your email"
              value={verificationData.emailConfirm}
              onChange={(e) => setVerificationData(prev => ({
                ...prev,
                emailConfirm: e.target.value
              }))}
              className="animated-input"
            />
            <input
              type="date"
              placeholder="Date of Birth"
              value={verificationData.dateOfBirth}
              onChange={(e) => setVerificationData(prev => ({
                ...prev,
                dateOfBirth: e.target.value
              }))}
              className="animated-input"
            />
            <div className="button-container">
              <button type="submit" className="animated-btn">Verify Identity</button>
              <button 
                type="button" 
                className="back-to-login animated-btn"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : step === "request" ? (
          <form onSubmit={handleRequestReset}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="animated-input"
            />
            <div className="info-text">
              We'll send a password reset link to this email address.
            </div>
            <div className="button-container">
              <button type="submit" className="animated-btn" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button 
                type="button" 
                className="back-to-login animated-btn"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <input
              type="text"
              placeholder="Enter reset token"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              className="animated-input"
            />
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="animated-input"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="animated-input"
            />
            <div className="button-container">
              <button type="submit" className="animated-btn">Reset Password</button>
              <button 
                type="button" 
                className="back-to-login animated-btn"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
