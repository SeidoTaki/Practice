import React, { useEffect, useRef, useState } from 'react';
import { Chart, LinearScale, CategoryScale, BarController, BarElement } from 'chart.js';

Chart.register(LinearScale, CategoryScale, BarController, BarElement);

const ActivityRating = ({ user_id: user_id }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activityData, setActivityData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const russianMonths = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  useEffect(() => {
    const fetchActivityData = async () => {
      setIsLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const response = await fetch(
          `http://localhost:5000/api/activity?user_id=${user_id}&year=${year}&month=${month}`
        );
        const data = await response.json();
        setActivityData(data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityData();
  }, [user_id, currentDate]);

  useEffect(() => {
    if (!activityData.length || !chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();

    const durations = Array.from({ length: daysInMonth }, (_, i) => {
      const dayData = activityData.find(item => {
        const itemDate = new Date(item.date);
        return itemDate.getDate() === i + 1;
      });
      return dayData?.has_workout ? dayData.duration || 0 : 0;
    });

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
        datasets: [{
          label: 'Минуты тренировок',
          data: durations,
          backgroundColor: 'rgba(75, 192, 192, 0.6)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Минуты' }
          },
          x: {
            title: { display: true, text: 'Дни месяца' }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [activityData, currentDate]);

  const handleMonthChange = (months) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + months);
      return newDate;
    });
  };

  if (isLoading) return <div>Загрузка данных активности...</div>;
  if (!activityData.length) return <div>Нет данных для отображения</div>;

  return (
    <div>
      <div className="month-navigation">
        <button onClick={() => handleMonthChange(-1)} disabled={isLoading}>
          &lt; Предыдущий месяц
        </button>

        <h2>{russianMonths[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>

        <button
          onClick={() => handleMonthChange(1)}
          disabled={isLoading || currentDate.getMonth() === new Date().getMonth()}
        >
          Следующий месяц &gt;
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <canvas
          ref={chartRef}
          aria-label={`График активности за ${russianMonths[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
        />
      </div>
    </div>
  );
};

export default ActivityRating;