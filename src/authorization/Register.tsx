import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import logo from '../assets/Logo.png';

type UserType = 'STUDENT' | 'PROFESSOR';

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  userType: UserType;
}

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    userType: '' as UserType,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterRequest, string>>>({});
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Partial<Record<keyof RegisterRequest, string>> = {};
    if (!formData.email) {
      newErrors.email = 'Электронная почта обязательна';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Неверный формат электронной почты';
    }
    if (!formData.username) {
      newErrors.username = 'Имя пользователя обязательно';
    }
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать не менее 6 символов';
    }
    if (!formData.userType) {
      newErrors.userType = 'Пожалуйста, выберите роль (Ученик или Преподаватель)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const request: RegisterRequest = {
      email: formData.email,
      username: formData.username,
      password: formData.password,
      userType: formData.userType,
    };

    try {
      const response = await api.post<RegisterResponse>('/api/auth/register', request, {
        headers: { 'Content-Type': 'application/json' },
      });
      const { accessToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userType', formData.userType); // Сохраняем userType
      setMessage('Регистрация прошла успешно!');
      console.log('Registration successful:', response.data);

      // Перенаправление после регистрации
      if (formData.userType === 'STUDENT') {
        navigate('/student-dashboard');
      } else if (formData.userType === 'PROFESSOR') {
        navigate('/professor-dashboard');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Ошибка при регистрации: ${error.message}`);
        console.error('Registration failed:', error.message);
      } else {
        setMessage('Неизвестная ошибка при регистрации');
        console.error('Registration failed:', error);
      }
    }
  };

  return (
    <div>
      <img className="mt-10 ml-10" src={logo} alt="Logo" />

      <div className="flex items-center justify-center bg-white">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-2 border-solid">
          <h2 className="text-2xl font-bold mb-6 text-center">Регистрация</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите свой email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="mb-5">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Имя пользователя
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите имя пользователя"
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

            <div className="mb-6">
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                Тип пользователя
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите роль</option>
                <option value="STUDENT">Студент</option>
                <option value="PROFESSOR">Профессор</option>
              </select>
              {errors.userType && <p className="text-red-500 text-sm mt-1">{errors.userType}</p>}
            </div>

            <button
              type="submit"
              className="w-full text-white p-2 rounded bg-black mb-4"
            >
              Зарегистрироваться
            </button>
            <Link
              to="/login"
              className="w-full text-center block text-blue-500 hover:underline"
            >
              Уже есть аккаунт? Войти
            </Link>
          </form>
          {message && <p className="text-green-500 text-sm mt-4 text-center">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default Register;