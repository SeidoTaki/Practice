import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Для отладки можно временно отключить StrictMode
const isDebugMode = process.env.NODE_ENV === 'development';

root.render(
  isDebugMode ? <App /> : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
);

reportWebVitals();