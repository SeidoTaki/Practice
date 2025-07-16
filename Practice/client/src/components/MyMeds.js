import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

export default function MyMeds({user_id: user_id }) {
  const [medications, setMedications] = useState([]);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', notes: '' });

  useEffect(() => {
    const fetchMedications = async () => {
      const response = await api.get('/api/medications', { params: { user_id: user_id } });
      setMedications(response.data);
    };

    if (user_id) fetchMedications();
  }, [user_id]);

  const addMedication = async (e) => {
    e.preventDefault();
    const response = await api.post('/api/medications', {
      user_id: user_id,
      ...newMed
    });
    setMedications([response.data, ...medications]);
    setNewMed({ name: '', dosage: '', notes: '' });
  };


  return (
    <div className="medications-container">
      <h2>Мои лекарства</h2>

      <form onSubmit={addMedication} className="medication-form">
        <input
          type="text"
          placeholder="Название лекарства"
          value={newMed.name}
          onChange={(e) => setNewMed({...newMed, name: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Дозировка"
          value={newMed.dosage}
          onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
          required
        />
        <textarea
          placeholder="Примечания"
          value={newMed.notes}
          onChange={(e) => setNewMed({...newMed, notes: e.target.value})}
        />
        <button type="submit">Добавить</button>
      </form>

      <div className="medications-list">
        {medications.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Название</th>
                <th>Дозировка</th>
                <th>Примечания</th>
                <th>Дата добавления</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((med, index) => (
                <tr key={`med-${med.id || index}`}>
                  <td>{med.name}</td>
                  <td>{med.dosage}</td>
                  <td>{med.notes || '-'}</td>
                  <td>{new Date(med.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Лекарства не найдены. Добавьте первое лекарство.</p>
        )}
      </div>
    </div>
  );
}