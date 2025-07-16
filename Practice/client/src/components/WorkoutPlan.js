import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

const WorkoutPlan = ({ user_id }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('');

  const daysTranslation = {
    'Monday': 'Понедельник',
    'Tuesday': 'Вторник',
    'Wednesday': 'Среда',
    'Thursday': 'Четверг',
    'Friday': 'Пятница',
    'Saturday': 'Суббота',
    'Sunday': 'Воскресенье',
    'Unassigned': 'Без дня'
  };

  const fetchWorkoutPlan = async () => {
    setLoading(true);
    try {
      const params = { user_id };
      if (selectedDay) params.day = selectedDay;

      const { data } = await api.get('/workout-plan', { params });
      setExercises(data.map(ex => ({
        ...ex,
        id: ex.id || ex.exercise_id,
        description: ex.description || 'Описание отсутствует'
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    try {
      await api.delete(`/workout-plan/${exerciseId}`);
      toast.success('Упражнение удалено!');
      setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    } catch (err) {
      toast.error('Ошибка удаления: ' + (err.response?.data?.error || err.message));
    }
  };

  const groupedExercises = exercises.reduce((acc, exercise) => {
    const day = exercise.day || 'Unassigned';
    if (!acc[day]) acc[day] = [];
    acc[day].push(exercise);
    return acc;
  }, {});

  const daysOrder = [
    'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday', 'Sunday', 'Unassigned'
  ];

  useEffect(() => {
    fetchWorkoutPlan();
  }, [selectedDay]);

  if (loading) {
    return <div className="loading">Загрузка плана тренировок...</div>;
  }

  return (
    <div className="workout-plan">
      <div className="header">
        <h2>Ваш план тренировок</h2>
        <div className="controls">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="">Все дни</option>
            {daysOrder.filter(day => day !== 'Unassigned').map(day => (
              <option key={day} value={day}>
                {daysTranslation[day]}
              </option>
            ))}
          </select>
          <button onClick={fetchWorkoutPlan}>
            Обновить
          </button>
        </div>
      </div>

      {exercises.length > 0 ? (
        <div className="days-container">
          {daysOrder.map(day => groupedExercises[day] && (
            <div key={day} className="day-section">
              <h3>{daysTranslation[day]}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Упражнение</th>
                    <th>Группа мышц</th>
                    <th>Подходы × Повторения</th>
                    <th>Описание</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedExercises[day].map(exercise => (
                    <tr key={exercise.id}>
                      <td>{exercise.name}</td>
                      <td>{exercise.muscle_group}</td>
                      <td>{exercise.sets} × {exercise.reps}</td>
                      <td>{exercise.description}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="delete-button"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-message">
          <p>В вашем плане нет упражнений.</p>
          <button onClick={fetchWorkoutPlan}>
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlan;