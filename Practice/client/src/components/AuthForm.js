import React, { useState } from 'react';
import axios from "axios";


const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    height: '',
    weight: '',
    chronic_diseases: ''
  });

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const url = isLogin ? 'http://localhost:5000/login' : 'http://localhost:5000/register';
     const res = await axios.post(url, JSON.stringify(formData), {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });

    if (res.data.token) {
        const payload = JSON.parse(atob(res.data.token.split('.')[1])); // Декодируем JWT
        console.log('JWT payload:', payload);
        console.log('Response data:', res.data);
        const user_id = payload.identity || res.data.user_id;
        console.log('Resolved user_id:', user_id);
        onLogin(res.data.token, user_id);
    }

  } catch (error) {
   if (error.response?.data?.error === "Username already exists") {
      alert("Это имя пользователя уже занято. Пожалуйста, выберите другое.");
    } else {
      console.error('Auth error:', error);
      alert(error.response?.data?.error || 'Ошибка при регистрации');
    }
  }
};

  return (
    <div className="auth-form-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>

        <div className="form-group">
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>

        {!isLogin && (
          <>
            <div className="form-group">
              <input
                type="number"
                placeholder="Height (cm)"
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
              />
            </div>

            <div className="form-group">
              <input
                type="number"
                placeholder="Weight (kg)"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="Chronic diseases (optional)"
                value={formData.chronic_diseases}
                onChange={(e) => setFormData({...formData, chronic_diseases: e.target.value})}
              />
            </div>
          </>
        )}

        <button type="submit" className="auth-button">
          {isLogin ? 'Login' : 'Register'}
        </button>

        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="switch-button"
        >
          {isLogin ? 'Switch to Register' : 'Switch to Login'}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;