import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NewExercises = ({ userId }) => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const muscleGroups = [
    'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core'
  ];

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await axios.get('http://localhost:5000/exercises');
        setExercises(response.data);
        setFilteredExercises(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const handleFilter = (group) => {
    setSelectedGroup(group);
    setFilteredExercises(
      group
        ? exercises.filter(ex => ex.muscle_group === group)
        : exercises
    );
  };

  const addToWorkoutPlan = async (exerciseId) => {
    try {
      await axios.post('http://localhost:5000/api/workout-plan', {
        user_id: userId,
        exercise_id: exerciseId,
        day: 'Monday', // По умолчанию
        sets: 3,
        reps: 10
      });
      alert('Exercise added to your workout plan!');
    } catch (err) {
      alert('Failed to add exercise: ' + err.message);
    }
  };

  if (loading) return <div>Loading exercises...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mt-4">
      <h2>New Exercises</h2>

      <div className="mb-3">
        <select
          value={selectedGroup}
          onChange={(e) => handleFilter(e.target.value)}
          className="form-select"
        >
          <option value="">All Muscle Groups</option>
          {muscleGroups.map((group) => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </div>

      <div className="row">
        {filteredExercises.map((ex) => (
          <div key={ex.exercise_id} className="col-md-4 mb-4">
            <div className="card h-100">
              {ex.image_url && (
                <img
                  src={ex.image_url}
                  className="card-img-top"
                  alt={ex.name}
                  style={{height: '200px', objectFit: 'cover'}}
                />
              )}
              <div className="card-body">
                <h5 className="card-title">{ex.name}</h5>
                <p className="card-text">
                  <strong>Muscle Group:</strong> {ex.muscle_group}
                </p>
                <p className="card-text">{ex.description}</p>
              </div>
              <div className="card-footer">
                <button
                  onClick={() => addToWorkoutPlan(ex.exercise_id)}
                  className="btn btn-primary"
                >
                  Add to Workout Plan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewExercises;