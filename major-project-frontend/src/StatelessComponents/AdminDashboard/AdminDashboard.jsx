import { Switch } from "@mui/material";
import { Trash2, UserCircle2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteApi, endpoints, fetchApi, postApi } from '../../utils/apiUtils';
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [classificationEnabled, setClassificationEnabled] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedTab, setSelectedTab] = useState('doctors'); // 'doctors', 'patients', or 'admins'
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [assignStatus, setAssignStatus] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchUsers();
    fetchClassificationState();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const doctorsResponse = await fetchApi(endpoints.admin.dashboard + '/doctors');
      const patientsResponse = await fetchApi(endpoints.admin.dashboard + '/patients');
      const adminsResponse = await fetchApi(endpoints.admin.dashboard + '/admins');
      setDoctors(doctorsResponse);
      setPatients(patientsResponse);
      setAdmins(adminsResponse);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('You are not authorized to access the admin panel');
        navigate('/login');
      }
    }
  };

  const fetchClassificationState = async () => {
    try {
      const response = await fetchApi(endpoints.admin.dashboard + '/classification-state');
      setClassificationEnabled(response.classificationEnabled);
    } catch (error) {
      console.error('Error fetching classification state:', error);
    }
  };

  const getAuthConfig = () => ({
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  const handleClassificationToggle = async () => {
    try {
      const response = await postApi(endpoints.admin.dashboard + '/toggle-classification', {
        enabled: !classificationEnabled
      });
      setClassificationEnabled(response.classificationEnabled);
    } catch (error) {
      console.error('Error toggling classification:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('You are not authorized to perform this action');
        navigate('/login');
      }
    }
  };
  const handleDeleteUser = async (userId, userType) => {
    if (window.confirm(`Are you sure you want to delete this ${userType}?`)) {
      try {
        await deleteApi(`${endpoints.admin.dashboard}/${userType}/${userId}`);
        fetchUsers(); // Refresh the lists
      } catch (error) {
        console.error('Error deleting user:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          alert('You are not authorized to perform this action');
          navigate('/login');
        }
      }
    }
  };

  const handleAssignDoctor = async (patientId) => {
    if (!selectedDoctor || !appointmentDate) {
      setAssignStatus("Please select doctor and date.");
      return;
    }
    try {
      setAssignStatus("Assigning...");
      const apiUrl = import.meta.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
      await axios.post(`${apiUrl}/api/admin/assign-doctor`,
        { doctorId: selectedDoctor, patientId, appointmentDate },
        getAuthConfig()
      );
      setAssignStatus("Doctor assigned successfully!");
      fetchUsers();
    } catch (err) {
      setAssignStatus("Failed to assign doctor.");
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
        <h1 className="sidebar__title">Admin Panel</h1>
        <nav className="sidebar__nav">
          <button className="sidebar__button sidebar__button--active">
            <UserCircle2 size={20} /> Dashboard
          </button>
        </nav>
        <button className="sidebar__logout" onClick={handleLogout}>
          <UserCircle2 size={18} /> Log Out
        </button>
      </aside>

      <main className="main-content">
        <header className="main-content__header">
          <div>
            <h2>Welcome, <strong>Admin</strong></h2>
            <p>Manage your system and users here</p>
          </div>
        </header>

        <section className="admin-section">
          <h3>System Management</h3>
          <div className="admin-cards">
            <div className="admin-card">
              <h4>Total Users</h4>
              <p>{doctors.length + patients.length}</p>
            </div>
            <div className="admin-card">
              <h4>Active Doctors</h4>
              <p>{doctors.length}</p>
            </div>
            <div className="admin-card">
              <h4>Active Patients</h4>
              <p>{patients.length}</p>
            </div>
          </div>
        </section>

        <section className="admin-section classification-control">
          <h3>Classification Control</h3>
          <div className="toggle-container">
            <span>Classification System:</span>
            <Switch
              checked={classificationEnabled}
              onChange={handleClassificationToggle}
              color="primary"
            />
            <span>{classificationEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </section>

        <section className="admin-section user-management">
          <h3>User Management</h3>
          <div className="tab-buttons">
            <button 
              className={`tab-button ${selectedTab === 'doctors' ? 'active' : ''}`}
              onClick={() => setSelectedTab('doctors')}
            >
              <Users size={18} /> Doctors
            </button>
            <button 
              className={`tab-button ${selectedTab === 'patients' ? 'active' : ''}`}
              onClick={() => setSelectedTab('patients')}
            >
              <Users size={18} /> Patients
            </button>
            <button 
              className={`tab-button ${selectedTab === 'admins' ? 'active' : ''}`}
              onClick={() => setSelectedTab('admins')}
            >
              <UserCircle2 size={18} /> Admins
            </button>
          </div>

          <div className="user-list">
            {selectedTab === 'admins' ? (
              <div className="user-table">
                <h4>Registered Admins</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Registration Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(admins) && admins.map(admin => (
                        <tr key={admin._id}>
                          <td>{admin.name}</td>
                          <td>{admin.email}</td>
                          <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteUser(admin._id, 'admin')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : selectedTab === 'doctors' ? (
              <div className="user-table">
                <h4>Registered Doctors</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Registration Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(doctors) && doctors.map(doctor => (
                        <tr key={doctor._id}>
                          <td>{doctor.name}</td>
                          <td>{doctor.email}</td>
                          <td>{new Date(doctor.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteUser(doctor._id, 'doctor')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="user-table">
                <h4>Registered Patients</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Serial Number</th>
                        <th>Classification Type</th>
                        <th>Registration Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(patients) && patients.map(patient => (
                        <tr key={patient._id}>
                          <td>{patient.name}</td>
                          <td>{patient.email}</td>
                          <td>{patient.patientInfo?.serial || 'N/A'}</td>
                          <td>{patient.patientInfo?.classificationType || patient.classificationType || 'N/A'}</td>
                          <td>{new Date(patient.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteUser(patient._id, 'patient')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="admin-section appointment-assignment">
          <h3>Assign Doctor to Patient</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Doctor Name</th>
                  <th>Appointment Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(patients) && patients.map(patient => (
                  <tr key={patient._id}>
                    <td>{patient.name}</td>
                    <td>
                      <select
                        value={selectedDoctor}
                        onChange={e => setSelectedDoctor(e.target.value)}
                      >
                        <option value="">Select Doctor</option>
                        {Array.isArray(doctors) && doctors.map(doc => (
                          <option key={doc._id} value={doc._id}>{doc.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={e => setAppointmentDate(e.target.value)}
                      />
                    </td>
                    <td>
                      <button onClick={() => handleAssignDoctor(patient._id)}>
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {assignStatus && <span className="assign-status">{assignStatus}</span>}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
