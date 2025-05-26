import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';

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
      <Header /> 
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