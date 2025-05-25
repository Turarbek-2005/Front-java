  import React, { useState } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import api from '../api';
  import logo from '../assets/Logo.png';
// import axios from 'axios';

  const UserMe = async ()=> {
    try  {
    const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("UserMe:", data);
    } catch (error) {
      console.error(error)
    }
  }

  interface LoginRequest {
    username: string;
    password: string;
  }

  interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    userType: 'STUDENT' | 'PROFESSOR'; // Добавляем userType в ответ
  }

  const Login: React.FC = () => {
    const [formData, setFormData] = useState<LoginRequest>({
      username: '',
      password: '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof LoginRequest, string>>>({});
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Для перенаправления

    const validateForm = () => {
      const newErrors: Partial<Record<keyof LoginRequest, string>> = {};

      if (!formData.password) {
        newErrors.password = 'Пароль обязателен';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Пароль должен содержать не менее 6 символов';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      const request: LoginRequest = {
        username: formData.username,
        password: formData.password,
      };

      try {
        const response = await api.post<LoginResponse>('/api/auth/login', request, {
          headers: { 'Content-Type': 'application/json' },
        });
        const { accessToken, refreshToken, userType } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userType', userType); // Сохраняем тип пользователя
        setMessage('Вход выполнен успешно!');
        console.log('Login successful:', response.data);

        // Перенаправление в зависимости от типа пользователя
        if (userType === 'STUDENT') {
          navigate('/student-dashboard');
        } else if (userType === 'PROFESSOR') {
          navigate('/professor-dashboard');
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          setMessage(`Ошибка при входе: ${error.message}`);
          console.error('Login failed:', error.message);
        } else {
          setMessage('Неизвестная ошибка при входеd');
          console.error('Login failed:', error);
        }
      }
      finally{
        UserMe()
      }
    };

    return (
      <div>
        <img className="mt-10 ml-10" src={logo} alt="Logo" />

        <div className="flex items-center justify-center bg-white">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-2 border-solid">
            <h2 className="text-2xl font-bold mb-6 text-center">Вход</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите свой username"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>

              <div className="mb-5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите пароль"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                className="w-full text-white p-2 rounded bg-black mb-4"
              >
                Войти
              </button>
              <Link
                to="/"
                className="w-full text-center block text-blue-500 hover:underline"
              >
                Нет аккаунта? Зарегистрироваться
              </Link>
            </form>
            {message && <p className="text-green-500 text-sm mt-4 text-center">{message}</p>}
          </div>
        </div>
      </div>
    );
  };

  export default Login;