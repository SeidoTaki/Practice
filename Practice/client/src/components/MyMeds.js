import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

export default function MyMeds({ userId }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    notes: ''
  });

  const fetchMedications = async () => {
    try {
      console.log('Fetching medications for user:', userId);
      const response = await api.get('/medications', {
        params: { user_id: userId }
      });
      console.log('Medications response:', response.data);
      setMedications(response.data);
    } catch (err) {
      console.error('Medications fetch error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load medications');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/medications', {
        user_id: userId,
        ...newMed
      });
      console.log('Added medication:', response.data);
      setMedications([response.data, ...medications]);
      setNewMed({ name: '', dosage: '', notes: '' });
    } catch (err) {
      console.error('Add medication error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to add medication');
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMedications();
    }
  }, [userId]);

  if (loading) return <div>Loading medications...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="medications-container">
      <h2>My Medications</h2>

      <form onSubmit={addMedication} className="medication-form">
        <input
          type="text"
          placeholder="Medication name"
          value={newMed.name}
          onChange={(e) => setNewMed({...newMed, name: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Dosage"
          value={newMed.dosage}
          onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
          required
        />
        <textarea
          placeholder="Notes"
          value={newMed.notes}
          onChange={(e) => setNewMed({...newMed, notes: e.target.value})}
        />
        <button type="submit">Add Medication</button>
      </form>

      <div className="medications-list">
        {medications.length > 0 ? (
          medications.map(med => (
            <div key={med.id} className="medication-item">
              <h3>{med.name}</h3>
              <p>Dosage: {med.dosage}</p>
              {med.notes && <p>Notes: {med.notes}</p>}
              <p>Added: {new Date(med.created_at).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p>No medications found. Add your first medication above.</p>
        )}
      </div>
    </div>
  );
}