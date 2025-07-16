import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

export default function MyCondition({ user_id: user_id }) {
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConditions = async () => {
      setLoading(true);
      const response = await api.get('/api/conditions', { params: { user_id: user_id } });
      setConditions(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setLoading(false);
    };

    if (user_id) fetchConditions();
  }, [user_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setLoading(true);
    const response = await api.post('/api/conditions', {
      user_id: user_id,
      rating,
      notes: notes.trim()
    });

    setConditions([response.data, ...conditions]);
    setNotes('');
    setRating(5);
    setLoading(false);
  };

  return (
    <div className="condition-page">
      <h2>Мое состояние</h2>

      <form onSubmit={handleSubmit} className="condition-form">
        <div className="form-group">
          <label>Оценка состояния: <span>{rating}/10</span></label>
          <input
            type="range"
            min="1"
            max="10"
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value))}
          />
        </div>

        <div className="form-group">
          <textarea
            placeholder="Как вы себя чувствуете сегодня?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button type="submit" disabled={loading || !notes.trim()}>
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>

      {conditions.length > 0 && (
        <div className="history-container">
          <h3>Последние записи:</h3>
          {conditions.slice(0, 30).map((condition, index) => (
            <div key={`${condition.date}-${index}`} className="history-item">
              <div className="history-date">
                {new Date(condition.date).toLocaleDateString()}
              </div>
              <div className="history-rating">
                Оценка: <strong>{condition.rating}/10</strong>
              </div>
              {condition.notes && <div className="history-notes">{condition.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}