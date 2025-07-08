import React, { useEffect, useRef } from 'react';
import { Chart, LinearScale, CategoryScale, BarController, BarElement } from 'chart.js';

// Регистрируем необходимые компоненты
Chart.register(LinearScale, CategoryScale, BarController, BarElement);

const ActivityRating = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null); // Для хранения экземпляра графика

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Уничтожаем предыдущий график, если он существует
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Создаем новый график и сохраняем ссылку
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        datasets: [{
          label: 'Минуты тренировок',
          data: [30, 45, 60, 20, 50, 10, 0],
          backgroundColor: 'rgba(75, 192, 192, 0.6)'
        }] // ПРИМЕР, ТУТ НУЖНО ПОДКЛЮЧИТЬ БД
      },
      options: {
        responsive: true, // Делаем график адаптивным
        scales: {
          y: {
            beginAtZero: true,
            type: 'linear' // Явно указываем тип шкалы
          },
          x: {
            type: 'category' // Явно указываем тип шкалы
          }
        }
      }
    });

    // Функция очистки при размонтировании компонента
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div>
      <h2>Оценка активности</h2>
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <canvas
          ref={chartRef}
          role="img"
          aria-label="График активности за неделю"
        />
      </div>
    </div>
  );
};

export default ActivityRating;