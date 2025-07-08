import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
  }
});

export default function MyCondition({ userId }) {
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConditions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/conditions', {
          params: { user_id: userId }
        });
        setConditions(response.data);
      } catch (err) {
        console.error('Failed to fetch conditions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchConditions();
    }
  }, [userId]);

  const handleSubmit = async () => {
    if (!userId || !notes.trim()) return;

    try {
      setLoading(true);
      const response = await api.post('/conditions', {
        user_id: userId,
        rating,
        notes: notes.trim()
      });

      setConditions([{
        id: response.data.id || Date.now(),
        date: new Date().toISOString(),
        rating,
        notes: notes.trim()
      }, ...conditions]);
      setNotes('');
    } catch (err) {
      console.error('Failed to save condition:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && conditions.length === 0) {
    return <div>Loading your conditions...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={() => setError(null)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="condition-container">
      <h2>Моё состояние</h2>

      <div className="condition-form">
        <div className="rating-container">
          <label>Оценка: {rating}/10</label>
          <input
            type="range"
            min="1"
            max="10"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          />
        </div>

        <textarea
          placeholder="Опишите ваше состояние сегодня"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !notes.trim()}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      <div className="condition-history">
        <h3>История за последние 30 дней</h3>
        <div className="calendar-grid">
          {Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayConditions = conditions.filter(c =>
              c.date && c.date.includes(dateStr)
            );

            return (
              <div key={i} className={`calendar-day ${dayConditions.length > 0 ? 'has-entry' : ''}`}>
                <div className="day-number">{date.getDate()}</div>
                {dayConditions.length > 0 && (
                  <div className="day-tooltip">
                    <strong>Оценка: {dayConditions[0].rating}/10</strong>
                    <p>{dayConditions[0].notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}