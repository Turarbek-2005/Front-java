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

const ProfessorDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId'); 
        if (!accessToken || !userId) {
          setError('Не авторизован. Пожалуйста, войдите.');
          setLoading(false);
          return;
        }

        const response = await api.get<CoursesResponse>('/api/courses', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log('Response data from /api/courses:', response.data);

        if (response.data && Array.isArray(response.data.items)) {
          const professorCourses = response.data.items.filter(
            (course) => course.uploadedUser.id === userId
          );
          setCourses(professorCourses);
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

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('Не авторизован. Пожалуйста, войдите.');
        return;
      }

      await api.delete(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setCourses((prevCourses) => prevCourses.filter((course) => course.id !== courseId));
      console.log(`Course with id ${courseId} deleted successfully`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Ошибка при удалении курса: ${err.message}`);
        console.error('Delete course failed:', err.message);
      } else {
        setError('Неизвестная ошибка при удалении курса');
        console.error('Delete course failed:', err);
      }
    }
  };

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
        <section>
          <h2 className="text-xl font-bold mb-4">Мои курсы</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.isArray(courses) && courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="relative bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleDeleteCourse(course.id);
                    }}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    title="Удалить курс"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <div onClick={() => handleCourseSelect(course.id)}>
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
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600">Нет созданных курсов.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfessorDashboard;