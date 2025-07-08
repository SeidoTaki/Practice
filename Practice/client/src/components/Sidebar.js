import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, activeSection, setActiveSection, onLogout }) => {
  return (
    <div className="sidebar">
      <h2>Здоровый образ жизни</h2>
      
      <div className="menu-section">
        <h3 
          className={activeTab === 'fitness' ? 'active' : ''}
          onClick={() => setActiveTab('fitness')}
        >
          Фитнес
        </h3>
        {activeTab === 'fitness' && (
          <div className="submenu">
            <p
              className={activeSection === 'activity' ? 'active' : ''}
              onClick={() => setActiveSection('activity')}
            >
              Сводка активности
            </p>
            <p
              className={activeSection === 'workout' ? 'active' : ''}
              onClick={() => setActiveSection('workout')}
            >
              Тренировочный план
            </p>
            <p
              className={activeSection === 'new' ? 'active' : ''}
              onClick={() => setActiveSection('new')}
            >
              Новые упражнения
            </p>
          </div>
        )}
      </div>

      <div className="menu-section">
        <h3
          className={activeTab === 'health' ? 'active' : ''}
          onClick={() => setActiveTab('health')}
        >
          Здоровье
        </h3>
        {activeTab === 'health' && (
          <div className="submenu">
            <p
              className={activeSection === 'meds' ? 'active' : ''}
              onClick={() => setActiveSection('meds')}
            >
              Мои таблетки
            </p>
            <p
              className={activeSection === 'condition' ? 'active' : ''}
              onClick={() => setActiveSection('condition')}
            >
              Мое состояние
            </p>
            <p
              className={activeSection === 'rating' ? 'active' : ''}
              onClick={() => setActiveSection('rating')}
            >
              Статистика
            </p>
          </div>
        )}
      </div>

      <div className="menu-section">
        <h3
          className={activeTab === 'summary' ? 'active' : ''}
          onClick={() => setActiveTab('summary')}
        >
          Полная сводка
        </h3>
      </div>


   <div className="menu-section">
        <h3
          className={activeTab === 'chatbot' ? 'active' : ''}
          onClick={() => setActiveTab('chatbot')}
        >
          Чат-бот
        </h3>
      </div>

      <button onClick={onLogout} style={{ marginTop: '20px' }}>
        Выйти
      </button>
    </div>
  );
};

export default Sidebar;