import React, { useState, useEffect, useCallback } from 'react';

export default function ActivitySummary({ userId }) {
  // Отладочный вывод
  console.log('ActivitySummary received userId:', userId);

  const [days, setDays] = useState(
    Array(30).fill().map((_, i) => ({
      id: i + 1,
      checked: false,
      duration: 0
    }))
  );

  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Добавленные функции для обработки изменений
  const handleCheckboxChange = (id) => {
    setDays(days.map(day =>
      day.id === id ? { ...day, checked: !day.checked } : day
    ));
  };

  const handleDurationChange = (id, value) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setDays(days.map(d =>
        d.id === id ? { ...d, duration: numValue } : d
      ));
    }
  };
   const fetchActivityData = useCallback(async () => {
    console.log('Fetching data for userId:', userId);
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5000/api/activity?user_id=${userId}`);

      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched data:', data);

      if (data && data.length > 0) {
        const updatedDays = days.map(day => {
          const record = data.find(r => r.day_number === day.id);
          return record ? { ...day, checked: record.has_workout, duration: record.duration || 0 } : day;
        });
        setDays(updatedDays);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setError('Ошибка загрузки данных. Проверьте консоль для деталей.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, days]);
  useEffect(() => {
    console.log('useEffect triggered with userId:', userId);
    if (!userId) {
      const errorMsg = 'ID пользователя не передан. Текущий userId: ' + userId;
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    fetchActivityData();
  }, [userId, fetchActivityData]);



  const handleSave = async () => {
    console.log('Saving data for userId:', userId);
    if (!userId) {
      const errorMsg = 'Отсутствует userId при сохранении. Текущий userId: ' + userId;
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          days: days.map(day => ({
            day_number: day.id,
            has_workout: day.checked,
            duration: day.checked ? day.duration : 0
          }))
        })
      });

      console.log('Save response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сервера');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="activity-summary">
      <h2>Статистика активности</h2>
      {isLoading && <p>Загрузка...</p>}
      {saveSuccess && <div className="alert alert-success">Данные успешно сохранены!</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="thead-dark">
            <tr>
              <th>День</th>
              <th>Тренировка</th>
              <th>Длительность (мин)</th>
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day.id}>
                <td>{day.id}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={day.checked}
                    onChange={() => handleCheckboxChange(day.id)}
                    disabled={isLoading}
                  />
                </td>
                <td>
                  {day.checked && (
                    <input
                      type="number"
                      min="0"
                      value={day.duration}
                      onChange={(e) => handleDurationChange(day.id, e.target.value)}
                      disabled={isLoading}
                      className="form-control"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading}
        className="btn btn-primary"
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Сохранение...
          </>
        ) : (
          'Сохранить активность'
        )}
      </button>
    </div>
  );
}