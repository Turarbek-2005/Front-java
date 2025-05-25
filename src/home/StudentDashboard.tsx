import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import logo from '../assets/Logo.png';

interface Course {
  id: string;
  uploadedUser: {
    id: string;
    email: string;
    username: string;
    userType: 'STUDENT' | 'PROFESSOR';
  };
  title: string;
  description: string;
  approximateTime: string;
  imageUrl: string | null;
}

const StudentDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          setError('Не авторизован. Пожалуйста, войдите.');
          return;
        }

        const response = await api.get<Course[]>('/api/courses', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setCourses(response.data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(`Ошибка при загрузке курсов: ${err.message}`);
          console.error('Fetch courses failed:', err.message);

        } else {
          setError('Неизвестная ошибка при загрузке курсов');
          console.error('Fetch courses failed:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseSelect = (courseId: string) => {
    // Логика выбора курса (например, переход на страницу курса)
    console.log(`Selected course with id: ${courseId}`);
    navigate(`/course/${courseId}`); // Пример маршрута для детальной страницы курса
  };

  if (loading) return <p className="text-center mt-10">Загрузка курсов...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

  return (
    <div>
      <img className="mt-10 ml-10" src={logo} alt="Logo" />
      <div className="flex items-center justify-center bg-white">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl border-2 border-solid">
          <h2 className="text-2xl font-bold mb-6 text-center">Главное меню студента</h2>
          <p className="text-center mb-6">Добро пожаловать, студент! Выберите курс:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="border border-gray-300 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleCourseSelect(course.id)}
              >
                <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-2">{course.description}</p>
                <p className="text-sm text-gray-500">Время: {course.approximateTime}</p>
                {course.imageUrl && (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
              </div>
            ))}
          </div>
          {courses.length === 0 && <p className="text-center">Нет доступных курсов.</p>}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;