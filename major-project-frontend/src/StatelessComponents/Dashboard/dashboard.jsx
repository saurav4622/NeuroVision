import axios from "axios";
import { UserCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../StatefullComponents/DashboardButton/Button";
import DateCalendarValue from "../../StatefullComponents/DateCalender/dateCalender";
import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const reminderTimeout = useRef(null);
  const [reminder, setReminder] = useState("");

  // Function to test connection to backend server
  const testBackendConnection = async () => {
    try {
      const response = await axios.get('http://localhost:5000/');
      console.log('Backend server connection test:', response.data);
      return true;
    } catch (error) {
      console.error('Backend connection test failed:', error.message);
      return false;
    }
  };
  
  useEffect(() => {
    // Check for authentication
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }
    
    // Test backend connection on component mount
    testBackendConnection()
      .then(isConnected => {
        if (!isConnected) {
          setMessage("Warning: Could not connect to the backend server. Prediction features may not work.");
          setMessageType("error");
        }
      });

    // For developer access, allow any role to view the dashboard
    if (token === 'dev-bypass-token') {
      setUser(storedUser);
      return;
    }

    // For regular access, verify user role
    if (storedUser.role === 'admin') {
      navigate('/admin');
      return;
    } else if (storedUser.role === 'doctor') {
      navigate('/doctor');
      return;
    }

    // Fetch the complete user data to ensure we have the patient serial
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/validate-session', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.user) {
          setUser(response.data.user);
          // Update localStorage with complete user data including serial
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(storedUser);
      }
    };

    fetchUserData();

    // Fetch patient appointments
    const fetchAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        setAppointmentsError("");
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const response = await axios.get(`${apiUrl}/api/doctor/appointments/patient`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setAppointments(response.data || []);
      } catch (err) {
        setAppointmentsError("Unable to fetch your appointments.");
        setAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };
    fetchAppointments();
  }, [navigate]);

  useEffect(() => {
    if (!appointments || appointments.length === 0) {
      setReminder("");
      return;
    }
    // Find the next upcoming appointment (approved or scheduled, not completed/denied)
    const now = new Date();
    const next = appointments
      .filter(a => a.status === 'approved' || a.status === 'scheduled')
      .map(a => ({ ...a, dateObj: new Date(a.date) }))
      .filter(a => a.dateObj > now)
      .sort((a, b) => a.dateObj - b.dateObj)[0];
    if (!next) {
      setReminder("");
      return;
    }
    const msUntil = next.dateObj - now;
    if (msUntil < 0) {
      setReminder("");
      return;
    }
    // Show time remaining
    const updateReminder = () => {
      const diff = next.dateObj - new Date();
      if (diff <= 0) {
        setReminder("");
        return;
      }
      const hours = Math.floor(diff / 1000 / 60 / 60);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      setReminder(`Next appointment: with Dr. ${next.doctorName || ''} in ${hours}h ${mins}m (${next.dateObj.toLocaleString()})`);
      reminderTimeout.current = setTimeout(updateReminder, 60000);
    };
    updateReminder();
    return () => {
      if (reminderTimeout.current) clearTimeout(reminderTimeout.current);
    };
  }, [appointments]);

  const validateFile = (file) => {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    
    if (!file) return false;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    return validExtensions.includes(fileExtension);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setMessage("");
    setPrediction(null);
  };
  const handleSave = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first");
      setMessageType("error");
      return;
    }

    if (!validateFile(selectedFile)) {
      setMessage("Please upload only image files (JPG, JPEG, PNG, GIF, BMP, WEBP)");
      setMessageType("error");
      return;
    }

    // First check if backend is accessible
    const isConnected = await testBackendConnection();
    if (!isConnected) {
      setMessage("Cannot connect to the backend server. Please ensure it's running.");
      setMessageType("error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        localStorage.setItem('mriImage', reader.result);
        localStorage.setItem('mriImageName', selectedFile.name);
        localStorage.setItem('mriUploadDate', new Date().toISOString());
        
        setMessage("Image saved successfully!");
        setMessageType("success");

        const imageData = reader.result.split(',')[1];        setIsLoading(true);
        console.log("Sending prediction request to backend...");
        
        // Set a timeout for the request to avoid hanging indefinitely
        const axiosConfig = {
          timeout: 30000, // 30 seconds timeout
          headers: {
            'Content-Type': 'application/json'
          }
        };        console.log("Making API request to predict endpoint...");
        const response = await axios.post('http://localhost:5000/api/predict', {
          image: imageData,
          filename: selectedFile.name,
          patientId: user?._id // Send patient ID if available
        }, axiosConfig);

        setPrediction(response.data.prediction);
        setMessageType("success");      } catch (error) {
        console.error('Prediction error:', error);        // Enhanced error logging and user feedback
        console.error('Axios error details:', error);
        
        // Check if the server responded with an error message
        if (error.response) {
          // The server responded with a status code outside of 2xx range
          console.error('Error response status:', error.response.status);
          console.error('Error response data:', error.response.data);          if (error.response.status === 404) {
            setMessage("API endpoint not found. Please ensure the backend server is running and check the endpoint configuration.");
          } else if (error.response.status === 500) {
            // Handle 500 errors with more details
            const errorMsg = error.response.data?.error || 'Unknown server error';
            setMessage(`Server error: ${errorMsg}`);
            
            // Display more detailed error message for developers in console
            if (error.response.data?.details) {
              console.error('Detailed error:', error.response.data.details);
            }
          } else {
            setMessage(`Server error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received from server');
          setMessage("No response from server. Please make sure the backend server is running at http://localhost:5000");
        } else {
          // Something happened in setting up the request
          console.error('Error setting up request:', error.message);
          setMessage(`Error: ${error.message}`);
        }
        
        setMessageType("error");
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setMessage("Failed to read the file");
      setMessageType("error");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleGetStarted = () => {
    if (!selectedFile) {
      setMessage("Please upload an MRI scan first");
      setMessageType("error");
      return;
    }
    handleSave();
  };
  const handleLogout = () => {
    // Clear all auth-related items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear MRI-related items
    localStorage.removeItem('mriImage');
    localStorage.removeItem('mriImageName');
    localStorage.removeItem('mriUploadDate');
    navigate('/logout');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h1 className="sidebar__title">NeuroVision</h1>
        <nav className="sidebar__nav">
          <button className="sidebar__button sidebar__button--active">
            <UserCircle2 size={20} /> Dashboard
          </button>          {/* Reports button removed as requested */}
        </nav>
        <button className="sidebar__logout" onClick={handleLogout}>
          <UserCircle2 size={18} /> Log Out
        </button>
      </aside>

      <main className="main-content">
        <header className="main-content__header">
          <div>
            <h2>Hello <strong>{user?.name || "User"}</strong>,</h2>
            <p>Have a nice day and don't forget to take care of your health!</p>
            <a href="#" className="main-content__link">Learn more →</a>
          </div>
          <img src="https://cdn-icons-png.flaticon.com/512/2920/2920081.png" alt="Yoga Icon" className="main-content__icon" />
        </header>

        <section className="upload-section">
          <p>Please upload your MRI scan Image</p>
          <p className="upload-instruction">Please upload only image files (JPG, JPEG, PNG, GIF, BMP, WEBP)</p>
          <input 
            type="file" 
            className="upload-section__input" 
            onChange={handleFileChange}
            accept="image/*"
          />
          {message && (
            <p className={`upload-message upload-message--${messageType}`}>
              {message}
            </p>
          )}
          {isLoading && (
            <p className="upload-message upload-message--info">
              Processing your image...
            </p>
          )}
          {prediction && (
            <p className="upload-message upload-message--success">
              Prediction: {prediction}
            </p>
          )}          {messageType === "error" && (
            <div className="error-troubleshooting">
              <p>If you're seeing prediction errors, try:</p>
              <ul>
                <li>Ensuring your MRI image is in a supported format</li>
                <li>Using a smaller image file (under 5MB)</li>
                <li>Waiting a moment and trying again</li>
              </ul>
            </div>
          )}
          <div onClick={handleSave}>
            <Button className="upload-section__save">{isLoading ? "Processing..." : "Get Started"}</Button>
          </div>
        </section>
        {reminder && <div className="reminder-banner">{reminder}</div>}
        <section className="patient-appointments-section">
          <h3>Upcoming Appointments</h3>
          {appointmentsLoading ? (
            <p>Loading appointments...</p>
          ) : appointmentsError ? (
            <p style={{color: 'red'}}>{appointmentsError}</p>
          ) : appointments.length === 0 ? (
            <p>No appointments scheduled.</p>
          ) : (
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt._id}>
                    <td>{new Date(appt.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{appt.doctorName || 'Unknown'}</td>
                    <td>{appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Get Started button removed as requested */}

        {/* Reports section removed as requested */}
      </main>      <aside className="right-panel">
        <div className="profile-card">
          <h3>{user?.name || "Guest User"}</h3>
          <p>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "User"}</p>
          {user?.patientInfo?.serial && (
            <p className="patient-serial">ID: {user.patientInfo.serial}</p>
          )}
        </div>        <div className="calendar-container">
          <DateCalendarValue />
        </div>
        {/* Removed background image that was showing an odd symbol */}</aside>
      {/* Removed the odd symbol/graphic from the bottom right corner */}
    </div>
  );
};

export default Dashboard;
