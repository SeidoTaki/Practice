import React, { useState, useEffect } from 'react';

const ActivitySummary = ({ user_id }) => {
  const russianMonths = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const russianWeekdays = [
    'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
    'Четверг', 'Пятница', 'Суббота'
  ];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState([]);
  const [activityData, setActivityData] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = new Date(year, month + 1, 0).getDate();

    const dates = Array.from({ length: daysCount }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        date,
        dayOfWeek: date.getDay(),
        formattedDate: `${String(i + 1).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`,
        apiDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
      };
    });

    setMonthData(dates);
  }, [currentDate]);

  useEffect(() => {
    const loadActivityData = async () => {
      setIsLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const response = await fetch(
          `http://localhost:5000/api/activity?user_id=${user_id}&year=${year}&month=${month}`
        );
        const data = await response.json();

        const formattedData = {};
        data.forEach(item => {
          const date = new Date(item.date);
          const key = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth()+1).toString().padStart(2, '0')}.${date.getFullYear()}`;
          formattedData[key] = {
            has_workout: item.has_workout,
            duration: item.duration || 0
          };
        });

        setActivityData(formattedData);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivityData();
  }, [user_id, currentDate]);

  const handleMonthChange = (months) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + months);
      return newDate;
    });
  };

  const handleCheckboxChange = (dateStr) => {
    setActivityData(prev => ({
      ...prev,
      [dateStr]: {
        has_workout: !prev[dateStr]?.has_workout,
        duration: prev[dateStr]?.duration || 0
      }
    }));
  };

  const handleDurationChange = (dateStr, value) => {
    const numValue = parseInt(value) || 0;
    setActivityData(prev => ({
      ...prev,
      [dateStr]: {
        has_workout: true,
        duration: numValue >= 0 ? numValue : 0
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const daysToSave = monthData.map(day => ({
        date: day.apiDate,
        has_workout: activityData[day.formattedDate]?.has_workout || false,
        duration: activityData[day.formattedDate]?.duration || 0
      }));

      await fetch('http://localhost:5000/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: parseInt(user_id),
          days: daysToSave
        })
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const isFutureMonth = currentDate.getMonth() > new Date().getMonth() &&
                       currentDate.getFullYear() >= new Date().getFullYear();

  return (
    <div className="activity-summary">
      <div className="month-navigation">
        <button onClick={() => handleMonthChange(-1)} disabled={isLoading}>
          &lt; Предыдущий месяц
        </button>

        <h2>{russianMonths[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>

        <button
          onClick={() => handleMonthChange(1)}
          disabled={isLoading || isFutureMonth}
        >
          Следующий месяц &gt;
        </button>
      </div>

      {isLoading && <div>Загрузка...</div>}
      {saveSuccess && <div className="alert-success">Данные успешно сохранены!</div>}

      <div className="table-responsive">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>День недели</th>
              <th>Тренировка</th>
              <th>Длительность (мин)</th>
            </tr>
          </thead>
          <tbody>
            {monthData.map((dayData, index) => {
              const dateStr = dayData.formattedDate;
              const activity = activityData[dateStr] || { has_workout: false, duration: 0 };

              return (
                <tr key={index}>
                  <td>{dateStr}</td>
                  <td>{russianWeekdays[dayData.dayOfWeek]}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={activity.has_workout}
                      onChange={() => handleCheckboxChange(dateStr)}
                      disabled={isFutureMonth}
                    />
                  </td>
                  <td>
                    {activity.has_workout && (
                      <input
                        type="number"
                        min="0"
                        value={activity.duration}
                        onChange={(e) => handleDurationChange(dateStr, e.target.value)}
                        disabled={isFutureMonth}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isFutureMonth && (
        <button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Сохранение...' : 'Сохранить активность'}
        </button>
      )}
    </div>
  );
};

export default ActivitySummary;