import axios from 'axios';
import { CalendarCheck2, FileUp, UserCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DateCalendarValue from "../../StatefullComponents/DateCalender/dateCalender";
import "./DoctorDashboard.css";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState({
    name: '',
    specialty: 'Specialist',
    hospital: 'Hospital'
  });
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    pendingReports: 0
  });
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const reminderTimeout = useRef(null);
  const [reminder, setReminder] = useState("");

  // Helper to ensure Dr. prefix
  const getDoctorDisplayName = (name) => {
    if (!name) return '';
    return name.trim().toLowerCase().startsWith('dr.') ? name : `Dr. ${name}`;
  };

  useEffect(() => {
    // Check for authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user) {
      navigate('/login');
      return;
    }

    // Verify doctor role
    if (user.role !== 'doctor') {
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'patient':
          navigate('/dashboard');
          break;
        default:
          navigate('/login');
      }
      return;
    }

    // Set doctor's name from stored user data
    setDoctorData({
      name: user.name || 'Doctor',
      specialty: user.doctorInfo?.specialty || 'Specialist',
      hospital: user.hospital || 'Hospital'
    });

    // Fetch doctor's dashboard data
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        
        // Get API URL from environment
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const response = await axios.get(`${apiUrl}/api/doctor/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data && response.data.success) {
          // Only set stats if data exists
          setStats({
            totalPatients: response.data.totalPatients || 0,
            appointmentsToday: response.data.appointmentsToday || 0,
            pendingReports: response.data.pendingReports || 0
          });
        }
        
      } catch (err) {
        console.error('Error fetching doctor data:', err);
        setError('Unable to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Fetch doctor's appointments (all or by date)
    const fetchAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        setAppointmentsError("");
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        // Fetch all future appointments
        const response = await axios.get(`${apiUrl}/api/doctor/appointments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setAppointments(response.data || []);
      } catch (err) {
        setAppointmentsError("Unable to fetch appointments.");
        setAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    fetchDoctorData();
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
      setReminder(`Next appointment: ${next.patientName ? 'with ' + next.patientName + ' ' : ''}in ${hours}h ${mins}m (${next.dateObj.toLocaleString()})`);
      reminderTimeout.current = setTimeout(updateReminder, 60000);
    };
    updateReminder();
    return () => {
      if (reminderTimeout.current) clearTimeout(reminderTimeout.current);
    };
  }, [appointments]);

  // Mark appointment as completed
  const handleCompleteAppointment = async (appointmentId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await axios.put(`${apiUrl}/api/doctor/appointments/${appointmentId}/complete`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAppointments((prev) => prev.map(appt => appt._id === appointmentId ? { ...appt, status: 'completed' } : appt));
    } catch (err) {
      alert('Failed to mark appointment as completed.');
    }
  };

  // Approve or deny appointment
  const handleAppointmentStatus = async (appointmentId, status) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await axios.put(
        `${apiUrl}/api/doctor/appointments/${appointmentId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments((prev) => prev.map(appt => appt._id === appointmentId ? { ...appt, status } : appt));
    } catch (err) {
      alert('Failed to update appointment status.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/logout');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h1 className="sidebar__title">Doctor Panel</h1>
        <nav className="sidebar__nav">
          <button className="sidebar__button sidebar__button--active">
            <UserCircle2 size={20} /> Dashboard
          </button>
          <button className="sidebar__button">
            <FileUp size={20} /> Patient Reports
          </button>
        </nav>
        <button className="sidebar__logout" onClick={handleLogout}>
          <UserCircle2 size={18} /> Log Out
        </button>
      </aside>

      <main className="main-content">
        <header className="main-content__header">
          <div>
            <h2>Welcome, <strong>{getDoctorDisplayName(doctorData.name)}</strong></h2>
            <p>Manage your patients and their reports</p>
          </div>
        </header>

        <section className="doctor-section">
          <h3>Patient Overview</h3>
          <div className="doctor-cards">
            {stats.totalPatients > 0 && (
              <div className="doctor-card">
                <h4>Total Patients</h4>
                <p>{stats.totalPatients}</p>
              </div>
            )}
            {stats.appointmentsToday > 0 && (
              <div className="doctor-card">
                <h4>Today's Appointments</h4>
                <p>{stats.appointmentsToday}</p>
              </div>
            )}
            {stats.pendingReports > 0 && (
              <div className="doctor-card">
                <h4>Pending Reports</h4>
                <p>{stats.pendingReports}</p>
              </div>
            )}
            {(stats.totalPatients === 0 && stats.appointmentsToday === 0 && stats.pendingReports === 0) && (
              <div className="doctor-card">
                <p>No patient or report data yet. Stats will appear after your patients complete a classification.</p>
              </div>
            )}
          </div>
        </section>

        <section className="doctor-section">
          {reminder && <div className="reminder-banner">{reminder}</div>}
          <h3><CalendarCheck2 size={20} style={{marginRight: 8}} /> Upcoming Appointments</h3>
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
                  <th>Patient</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt._id}>
                    <td>{new Date(appt.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{appt.patientName || 'Unknown'}</td>
                    <td>{appt.status === 'completed' ? <span style={{color: 'green'}}>Completed</span> : appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}</td>
                    <td>
                      {appt.status === 'scheduled' && (
                        <>
                          <button onClick={() => handleAppointmentStatus(appt._id, 'approved')} style={{marginRight: 8, color: 'green'}}>Approve</button>
                          <button onClick={() => handleAppointmentStatus(appt._id, 'denied')} style={{color: 'red'}}>Deny</button>
                        </>
                      )}
                      {appt.status === 'approved' && (
                        <button onClick={() => handleAppointmentStatus(appt._id, 'completed')} style={{color: '#4a00e0'}}>Mark as Done</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      <aside className="right-panel">
        <div className="profile-card">
          <h3>{getDoctorDisplayName(doctorData.name)}</h3>
          <p>{doctorData.specialty} | {doctorData.hospital}</p>
        </div>
        <div className="calendar-container">
          <DateCalendarValue />
        </div>
      </aside>
    </div>
  );
};

export default DoctorDashboard;
