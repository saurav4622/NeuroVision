import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './PatientDetails.css';

const PatientDetails = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [medications, setMedications] = useState('');
  const [review, setReview] = useState('');

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || process.env.BACKEND_URL;
        const token = localStorage.getItem('token');
        const response = await axios.get(`${apiUrl}/api/doctor/patient/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPatient(response.data);
      } catch (err) {
        setError('Failed to fetch patient details.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [patientId]);

  const handleSave = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || process.env.BACKEND_URL;
      const token = localStorage.getItem('token');
      await axios.post(
        `${apiUrl}/api/doctor/patient/${patientId}/update`,
        { medications, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Medications and review saved successfully.');
    } catch (err) {
      alert('Failed to save medications and review.');
    }
  };

  if (loading) return <p>Loading patient details...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="patient-details">
      <h2>Patient Details</h2>
      <p><strong>Name:</strong> {patient.name}</p>
      <p><strong>Classification History:</strong> {patient.classificationHistory || 'N/A'}</p>
      <p><strong>Medical History:</strong> {patient.medicalHistory || 'N/A'}</p>
      <p><strong>Time Remaining for Next Appointment:</strong> {patient.timeRemaining || 'N/A'}</p>

      <h3>Medications and Review</h3>
      <textarea
        placeholder="Write medications here..."
        value={medications}
        onChange={(e) => setMedications(e.target.value)}
      />
      <textarea
        placeholder="Write review here..."
        value={review}
        onChange={(e) => setReview(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default PatientDetails;
