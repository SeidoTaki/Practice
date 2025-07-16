import React, {useEffect, useState} from 'react';
import axios from 'axios';
import './ChatComponent.css';

const ChatComponent = ({ user_id }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      text: "Привет! Я ваш помощник по здоровому образу жизни и упражнениям. Спросите меня о правильном питании, тренировках или упражнениях на конкретную группу мышц.",
      sender: 'bot'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);


  // Загрузка сессии при монтировании компонента
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/chat/session', {
          params: { user_id: user_id }
        });

        if (res.data.session_id) {
          setSessionId(res.data.session_id);
          if (res.data.messages && res.data.messages.length > 0) {
            const loadedMessages = res.data.messages.map(msg => ({
              text: msg.text,
              sender: msg.sender
            }));
            setMessages(loadedMessages);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки сессии:', error);
      }
    };

    if (user_id) {
    loadSession().catch(error => {
      console.error('Ошибка при загрузке сессии:', error);
    });
  }
}, [user_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Добавляем сообщение пользователя
    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const prompt = input;
      const res = await axios.post('http://localhost:5000/api/chat', {
        prompt,
        model: 'llama3.2:3b',
        session_id: sessionId,
        user_id: user_id
      });

      if (res.data.session_id && !sessionId) {
        setSessionId(res.data.session_id);
      }

      // Обработка разных форматов ответа от сервера
      const botResponse = res.data?.response || res.data?.text || "Не удалось получить ответ";
      setMessages(prev => [...prev, {
          text: botResponse,
          sender: 'bot'
        }]);
      // Проверка тематики ответа
      const lowerResponse = botResponse.toLowerCase();
      if (lowerResponse.includes("не могу") ||
          lowerResponse.includes("не по теме") ||
          lowerResponse.includes("не связан")) {
        setMessages(prev => [...prev, {
          text: "Извините, я могу отвечать только на вопросы о здоровом образе жизни, питании и упражнениях.",
          sender: 'bot'
        }]);
      }
    } catch (error) {
      console.error('Ошибка запроса:', error);

      let errorMessage = 'Произошла ошибка при подключении к сервису.';
      if (error.response) {
        // Ошибка от сервера
        if (error.response.status === 403) {
          errorMessage = 'Ошибка CORS: проверьте настройки сервера';
        } else if (error.response.status === 404) {
          errorMessage = 'Сервер не найден (404)';
        }
      } else if (error.request) {
        // Запрос был сделан, но ответ не получен
        errorMessage = 'Сервер не отвечает';
      }

      setMessages(prev => [...prev, {
        text: errorMessage,
        sender: 'bot'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Фитнес-ассистент</h2>
        <p>Консультации по ЗОЖ и упражнениям</p>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <div className="message-content">
              {message.text.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Спросите о упражнениях или питании..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? '...' : 'Отправить'}
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;