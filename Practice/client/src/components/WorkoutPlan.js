import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
  }
});

const WorkoutPlan = ({ userId }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');

  const fetchWorkoutPlan = useCallback(async (signal) => {
    setLoading(true);
    setError(null);

    try {
      const params = { user_id: userId };
      if (selectedMuscleGroup) params.muscle_group = selectedMuscleGroup;

      const response = await api.get('/workout-plan', {
        params,
        signal
      });

      if (!response.data) {
        throw new Error('Server returned empty response');
      }

      const normalizedExercises = response.data.map((ex, index) => ({
        id: ex.exercise_id || ex.id || `temp-${index}-${Date.now()}`,
        name: ex.name || 'Unnamed Exercise',
        muscleGroup: ex.muscle_group || ex.muscleGroup || 'Not specified',
        day: ex.day || 'Not scheduled',
        sets: ex.sets || 3,
        reps: ex.reps || 10,
        imageUrl: ex.image_url || ex.imageUrl || '/images/default-exercise.jpg'
      }));

      setExercises(normalizedExercises);
    } catch (err) {
      if (axios.isCancel(err)) return;

      const errorMessage = err.response?.data?.message ||
                         err.message ||
                         'Failed to load workout plan';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedMuscleGroup]);

  useEffect(() => {
    const controller = new AbortController();
    fetchWorkoutPlan(controller.signal);

    return () => controller.abort();
  }, [fetchWorkoutPlan]);

  const handleRetry = () => {
    const controller = new AbortController();
    fetchWorkoutPlan(controller.signal);
  };

  const handleMuscleGroupChange = (e) => {
    setSelectedMuscleGroup(e.target.value);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading your workout plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <p>{error}</p>
        <button onClick={handleRetry} className="btn btn-primary">
          ↻ Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Your Workout Plan</h2>
        <div>
          <select
            value={selectedMuscleGroup}
            onChange={handleMuscleGroupChange}
            className="form-select me-2"
            style={{width: '200px'}}
          >
            <option value="">All Muscle Groups</option>
            <option value="chest">Chest</option>
            <option value="back">Back</option>
            <option value="legs">Legs</option>
            <option value="arms">Arms</option>
            <option value="shoulders">Shoulders</option>
            <option value="core">Core</option>
          </select>
          <button onClick={handleRetry} className="btn btn-outline-primary">
            ↻ Refresh
          </button>
        </div>
      </div>

      {exercises.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Exercise</th>
                <th>Muscle Group</th>
                <th>Day</th>
                <th>Sets × Reps</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map(exercise => (
                <tr key={exercise.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        className="me-3 rounded"
                        style={{width: '60px', height: '60px', objectFit: 'cover'}}
                      />
                      <span>{exercise.name}</span>
                    </div>
                  </td>
                  <td>{exercise.muscleGroup}</td>
                  <td>{exercise.day}</td>
                  <td>{exercise.sets} × {exercise.reps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-info">
          <p>No exercises found in your workout plan.</p>
          <button onClick={handleRetry} className="btn btn-primary">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

WorkoutPlan.propTypes = {
  userId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired
};

export default WorkoutPlan;