import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SignupLoader from "../../StatefullComponents/SignupLoader/SignupLoader";
import "./login-button.css";
import "./userSignUp.css";

const UserSignUp = () => {  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    patientInfo: {
      dateOfBirth: "",
      gender: ""
    }
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value) error = 'Name is required';
        else if (value.length < 2) error = 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Email is invalid';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 8) error = 'Password must be at least 8 characters';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = 'Password must contain uppercase, lowercase, and number';
        }
        break;
      case 'confirmPassword':
        if (!value) error = 'Please confirm your password';
        else if (value !== form.password) error = 'Passwords do not match';
        break;
      case 'patientInfo.dateOfBirth':
        if (form.role === 'patient' && !value) error = 'Date of birth is required';
        break;
      case 'patientInfo.gender':
        if (form.role === 'patient' && !value) error = 'Gender is required';
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, e.target.value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (name === 'role') {
      setErrors({});
      setTouched({});
    }

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  
  const validateForm = () => {
    const newErrors = {};
    const newTouched = {};
    
    ['name', 'email', 'password', 'confirmPassword'].forEach(field => {
      newTouched[field] = true;
      newErrors[field] = validateField(field, form[field]);
    });
    
    if (form.role === 'patient') {
      ['dateOfBirth', 'gender'].forEach(field => {
        const fullField = `patientInfo.${field}`;
        newTouched[fullField] = true;
        newErrors[fullField] = validateField(fullField, form.patientInfo[field]);
      });
    }
    
    setTouched(newTouched);
    setErrors(newErrors);
    
    return Object.values(newErrors).every(error => !error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstError = document.querySelector('.field-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setLoading(true);
    try {
      const formattedForm = {
        ...form,
        patientInfo: form.role === 'patient' ? {
          ...form.patientInfo,
          dateOfBirth: form.patientInfo.dateOfBirth ? new Date(form.patientInfo.dateOfBirth).toISOString() : undefined
        } : undefined
      };

      if (!formattedForm.patientInfo) delete formattedForm.patientInfo;      
      console.log('Submitting form:', { ...formattedForm, password: '[REDACTED]' });
      
      const apiUrl = import.meta.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
      const response = await fetch(`${apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formattedForm)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);      
      if (response.ok) {        // Show loader for 1s before OTP page
        setTimeout(() => {
          setLoading(false);
          // Pass more complete data to the OTP verification page
          navigate('/verify-otp', { 
            state: { 
              email: form.email, 
              userId: data.userId, 
              role: form.role,
              name: form.name
            } 
          });
        }, 1000);
        return;
      } else {
        setLoading(false);
        
        // Handle specific error types from the backend
        if (data.errorType === 'DUPLICATE_EMAIL') {
          alert(`Account Already Exists\n\nAn account with the email "${form.email}" already exists.\n\nPlease:\n• Login with your existing account, or\n• Use a different email address`);
        } else if (data.errorType === 'VALIDATION_ERROR') {
          alert(`Validation Error\n\n${data.message}`);
        } else {
          alert(`Registration Failed\n\n${data.message || data.error || 'An unexpected error occurred'}`);
        }
        
        throw new Error(data.error || 'Failed to register');
      }
    } catch (error) {
      setLoading(false);
      console.error('Registration error:', error);
      alert(error.message || 'An error occurred during registration');
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Create Account</h2>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
            <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SignupLoader />
            </div>
            <div style={{marginTop: 24, fontWeight: 500, color: '#4a00e0', fontSize: 18}}>Creating your account...</div>
            <div style={{marginTop: 8, color: '#888', fontSize: 14}}>Please wait, do not refresh the page.</div>
          </div>
        )}
        {!loading && (
        <form onSubmit={handleSubmit}>
            <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label className="required-field">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.name && touched.name ? 'input-error' : ''}
                  required
                />
                {errors.name && touched.name && (
                  <div className="field-error">{errors.name}</div>
                )}
              </div>
            </div>

            <div className="form-col">
              <div className="form-group">
                <label className="required-field">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.email && touched.email ? 'input-error' : ''}
                  required
                />
                {errors.email && touched.email && (
                  <div className="field-error">{errors.email}</div>
                )}
              </div>
            </div>
          </div>
            <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label className="required-field">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.password && touched.password ? 'input-error' : ''}
                    required
                  />                  <button 
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} opacity={0.8} /> : <Eye size={18} opacity={0.8} />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <div className="field-error">{errors.password}</div>
                )}
              </div>
            </div>

            <div className="form-col">
              <div className="form-group">
                <label className="required-field">Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.confirmPassword && touched.confirmPassword ? 'input-error' : ''}
                    required
                  />                  <button 
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} opacity={0.8} /> : <Eye size={18} opacity={0.8} />}
                  </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <div className="field-error">{errors.confirmPassword}</div>
                )}
              </div>
            </div>
          </div>          <div className="form-row">
            <div className="form-col">
              {form.role === 'patient' && (
              <div className="form-group">
                <label className="required-field">Date of Birth</label>
                <input
                  type="date"
                  name="patientInfo.dateOfBirth"
                  value={form.patientInfo.dateOfBirth}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors['patientInfo.dateOfBirth'] && touched['patientInfo.dateOfBirth'] ? 'input-error' : ''}
                  required
                />
                {errors['patientInfo.dateOfBirth'] && touched['patientInfo.dateOfBirth'] && (
                  <div className="field-error">{errors['patientInfo.dateOfBirth']}</div>
                )}
              </div>
              )}
            </div>
            <div className="form-col">
              {form.role === 'patient' && (
              <div className="form-group">
                <label className="required-field">Gender</label>
                <select
                  name="patientInfo.gender"
                  value={form.patientInfo.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors['patientInfo.gender'] && touched['patientInfo.gender'] ? 'input-error' : ''}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors['patientInfo.gender'] && touched['patientInfo.gender'] && (
                  <div className="field-error">{errors['patientInfo.gender']}</div>
                )}
              </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="required-field">Account Type</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="form-select"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>          <div className="button-container">
            <button type="submit" className="signup-button">Sign Up</button>
            <div className="login-link">
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                Already have an account? Login
              </a>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default UserSignUp;