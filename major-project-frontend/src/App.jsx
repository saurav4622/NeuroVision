import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./StatelessComponents/AdminDashboard/AdminDashboard";
import CoverPage from "./StatelessComponents/CoverPage/CoverPage";
import Dashboard from "./StatelessComponents/Dashboard/dashboard";
import DoctorDashboard from "./StatelessComponents/DoctorDashboard/DoctorDashboard";
import PatientDetails from './StatelessComponents/DoctorDashboard/PatientDetails';
import ForgotPassword from "./StatelessComponents/Login/ForgotPassword";
import UserLogin from "./StatelessComponents/Login/userLogin";
import Logout from "./StatelessComponents/Logout/Logout";
import UserSignUp from "./StatelessComponents/User/userSignUp";
import VerifyOtp from "./StatelessComponents/User/verifyOtp";

function App() {
  return (    <>        <Router>
        <Routes>
          <Route index element={<CoverPage />} />
          <Route path="/" element={<CoverPage />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/signup" element={<UserSignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/logout" element={<Logout />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRoles={['patient']} />} />
          <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />} />
          <Route path="/doctor" element={<ProtectedRoute element={<DoctorDashboard />} allowedRoles={['doctor']} />} />
          <Route path="/doctor/patient/:patientId" element={<PatientDetails />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
