import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import FitnessSection from './components/FitnessSection';
import HealthSection from './components/HealthSection';
import ChatComponent from "./components/ChatComponent";
import AuthForm from './components/AuthForm';

function App() {
  const [activeTab, setActiveTab] = useState('fitness');
  const [activeSection, setActiveSection] = useState('activity'); // Устанавливаем активной "Сводка активности" по умолчанию
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user_id, setUserId] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('user_id');
    if (storedToken && storedUserId) {
      setToken(storedToken);
      setUserId(storedUserId);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token, user_id) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user_id', user_id);

    setToken(token);
    setUserId(user_id);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  // Обработчик изменения вкладки
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Устанавливаем активную секцию в зависимости от выбранной вкладки
    if (tab === 'fitness') {
      setActiveSection('activity'); // Для фитнеса - "Сводка активности"
    } else if (tab === 'health') {
      setActiveSection('meds'); // Для здоровья - "Мои таблетки"
    }
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return <AuthForm onLogin={handleLogin} />;
    }

    switch(activeTab) {
      case 'chatbot':
        return <ChatComponent user_id={user_id}/>;
      case 'fitness':
        return <FitnessSection activeSection={activeSection} user_id={user_id}  />;
      case 'health':
        return <HealthSection activeSection={activeSection} user_id={user_id} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      {isAuthenticated && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange} // Используем наш обработчик вместо setActiveTab
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={handleLogout}
        />
      )}

      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;