import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface CourseForm {
  title: string;
  description: string;
  approximateTime: string;
}

const CreateCourse: React.FC = () => {
  const [formData, setFormData] = useState<CourseForm>({
    title: '',
    description: '',
    approximateTime: '',
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('Не авторизован. Пожалуйста, войдите.');
        return;
      }

      const response = await api.post('/api/courses', formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
      });

      if (response.status === 201) {
        console.log('Course created successfully:', response.data);
        navigate('/professor-dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Ошибка при создании курса: ${err.message}`);
        console.error('Create course failed:', err.message);
        if ('response' in err && err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
        }
      } else {
        setError('Неизвестная ошибка при создании курса');
        console.error('Create course failed:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Создать курс</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Название курса</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Описание</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Примерное время (например, 2:00)</label>
          <input
            type="text"
            name="approximateTime"
            value={formData.approximateTime}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Создать
        </button>
      </form>
    </div>
  );
};

export default CreateCourse;