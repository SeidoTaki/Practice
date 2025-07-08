import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import FitnessSection from './components/FitnessSection';
import HealthSection from './components/HealthSection';
import SummarySection from './components/SummarySection';
import ChatComponent from "./components/ChatComponent";
import AuthForm from './components/AuthForm';

function App() {
  const [activeTab, setActiveTab] = useState('fitness');
  const [activeSection, setActiveSection] = useState('activity');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  // Проверяем токен при загрузке приложения
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    if (storedToken && storedUserId) {
      setToken(storedToken);
      setUserId(storedUserId);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token, user_id) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', user_id);

    setToken(token);
    setUserId(user_id);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return <AuthForm onLogin={handleLogin} />;
    }

    switch(activeTab) {
      case 'chatbot':
        return <ChatComponent />;
      case 'fitness':
        return <FitnessSection activeSection={activeSection} />;
      case 'health':
        return <HealthSection activeSection={activeSection} />;
      case 'summary':
        return <SummarySection userId={userId} />;
    }
  };

  return (
    <div className="app">
      {isAuthenticated && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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