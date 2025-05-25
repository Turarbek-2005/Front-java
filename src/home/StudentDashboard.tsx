import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import logo from '../assets/LogoWhite.png';
import profileLogo from '../assets/profileLogo.png';

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

interface CoursesResponse {
  total: number;
  items: Course[];
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
          setLoading(false);
          return;
        }

        const response = await api.get<CoursesResponse>('/api/courses', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log('Response data from /api/courses:', response.data);

        if (response.data && Array.isArray(response.data.items)) {
          setCourses(response.data.items);
        } else {
          setError('Данные курсов не содержат массив в поле items');
          setCourses([]);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(`Ошибка при загрузке курсов: ${err.message}`);
          console.error('Fetch courses failed:', err.message);
        } else {
          setError('Неизвестная ошибка при загрузке курсов');
          console.error('Fetch courses failed:', err);
        }
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseSelect = (courseId: string) => {
    console.log(`Selected course with id: ${courseId}`);
    navigate(`/course/${courseId}`);
  };

  if (loading) return <p className="text-center mt-10 text-gray-600">Загрузка курсов...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Шапка */}
      <header className="bg-black text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Logo" />
        </div>
        <div className="flex items-center ml-auto space-x-4 mr-5">
          <div className="relative inline-block right-0">
            <input
              type="text"
              placeholder="Поиск..."
              className="w-80 p-2 pl-8 rounded bg-gray-800 text-white focus:outline-none"
            />
            <svg
              className="w-5 h-5 absolute left-2 top-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div>
          <img src={profileLogo} alt="Profile Logo" />
        </div>
      </header>

      {/* Основной контент */}
      <main className="p-6">
        {/* Секция "Все курсы" */}
        <section>
          <h2 className="text-xl font-bold mb-4">Все курсы</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.isArray(courses) && courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleCourseSelect(course.id)}
                >
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-12 h-12 rounded mb-2 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded mb-2"></div>
                  )}
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.description}</p>
                  <p className="text-sm text-gray-600">{`Время: ${course.approximateTime}`}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600">Нет доступных курсов.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;