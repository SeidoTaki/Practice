import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NewExercises = ({ user_id }) => {
  const [exercises, setExercises] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [workoutParams, setWorkoutParams] = useState({
    day: 'Monday',
    sets: 3,
    reps: 10
  });

  const muscle_group = ['Грудь', 'Спина', 'Ноги', 'Руки', 'Плечи', 'Пресс'];

  useEffect(() => {
    axios.get('http://localhost:5000/exercises')
      .then(({ data }) => setExercises(data))
      .catch(err => {
  console.error("Ошибка загрузки упражнений:", err); // Логируем ошибку
  toast.error(`Ошибка загрузки упражнений: ${err.message || "Неизвестная ошибка"}`);
});
  }, []);

  const filteredExercises = selectedGroup
    ? exercises.filter(ex => ex.muscle_group === selectedGroup)
    : exercises;

  const addToWorkoutPlan = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/workout-plan', {
        user_id: Number(user_id),
        exercise_id: Number(selectedExercise.exercise_id),
        ...workoutParams
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Упражнение добавлено!');
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка при добавлении');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Новые упражнения</h2>

      <select
        value={selectedGroup}
        onChange={(e) => setSelectedGroup(e.target.value)}
        className="form-select"
      >
        <option value="">Все группы мышц</option>
        {muscle_group.map(group => (
          <option key={group} value={group}>{group}</option>
        ))}
      </select>

      <div className="row row-cols-1 row-cols-md-3 g-4">
        {filteredExercises.map(ex => (
          <div key={ex.exercise_id} className="col">
            <div className="card h-100">
              {ex.image_url && (
                <img
                  src={ex.image_url}
                  className="card-img-top"
                  alt={ex.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
              )}
              <div className="card-body">
                <h5 className="card-title">{ex.name}</h5>
                <p className="card-text text-muted">{ex.muscle_group}</p>
                <p className="card-text">{ex.description}</p>
              </div>
              <div className="card-footer">
                <button
                  onClick={() => {
                    setSelectedExercise(ex);
                    setShowModal(true);
                  }}
                  className="btn btn-primary w-100"
                >
                  Добавить в план
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Добавить упражнение</h5>
                <button onClick={() => setShowModal(false)}>×</button>
              </div>
              <form onSubmit={addToWorkoutPlan}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label>День недели</label>
                    <select
                      name="day"
                      value={workoutParams.day}
                      onChange={(e) => setWorkoutParams({...workoutParams, day: e.target.value})}
                      required
                    >
                      <option value="Monday">Понедельник</option>
                      <option value="Tuesday">Вторник</option>
                      <option value="Wednesday">Среда</option>
                      <option value="Thursday">Четверг</option>
                      <option value="Friday">Пятница</option>
                      <option value="Saturday">Суббота</option>
                      <option value="Sunday">Воскресенье</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label>Подходы</label>
                    <input
                      type="number"
                      name="sets"
                      min="1"
                      value={workoutParams.sets}
                      onChange={(e) => setWorkoutParams({...workoutParams, sets: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>Повторения</label>
                    <input
                      type="number"
                      name="reps"
                      min="1"
                      value={workoutParams.reps}
                      onChange={(e) => setWorkoutParams({...workoutParams, reps: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)}>
                    Отмена
                  </button>
                  <button type="submit">Добавить</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewExercises;