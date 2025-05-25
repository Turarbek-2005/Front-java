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

interface Module {
  id: string;
  course: {
    id: string;
  };
  moduleType: 'TEXT' | 'VIDEO' | 'TEST';
  moduleNum: number;
  moduleTitle: string;
  text: string | null;
  video: { id: string; videoUrl: string } | null;
  test: any | null;
}

interface CoursesResponse {
  total: number;
  items: Course[];
}

interface ModulesResponse {
  total: number;
  items: Module[];
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
          if ('response' in err && err.response) {
            console.error('Response data:', err.response.data);
            console.error('Response status:', err.response.status);
          }
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

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('Отсутствует refreshToken. Пожалуйста, войдите заново.');
      }

      const response = await api.post('/api/auth/refresh', { refreshToken });
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      console.log('Access token refreshed successfully');
      return accessToken;
    } catch (err: unknown) {
      console.error('Failed to refresh token:', err);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userType');
      navigate('/');
      throw new Error('Не удалось обновить токен. Перенаправление на страницу входа.');
    }
  };

  const fetchModules = async (courseId: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Не авторизован. Пожалуйста, войдите.');
      }

      const response = await api.get<ModulesResponse>(`/api/modules/course/${courseId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log(`Modules for course ${courseId}:`, response.data);
      return response.data.items || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Fetch modules failed:', err.message);
        if ('response' in err && err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
        }
      }
      return [];
    }
  };

  const deleteModule = async (moduleId: string) => {
    let accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('Не авторизован. Пожалуйста, войдите.');
    }

    try {
      const response = await api.delete(`/api/modules/${moduleId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: '*/*',
        },
      });

      if (response.status === 204) {
        console.log(`Module with id ${moduleId} deleted successfully`);
      }
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err && err.response?.status === 401) {
        accessToken = await refreshAccessToken();
        const retryResponse = await api.delete(`/api/modules/${moduleId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: '*/*',
          },
        });

        if (retryResponse.status === 204) {
          console.log(`Module with id ${moduleId} deleted successfully after token refresh`);
        }
      } else {
        if (err instanceof Error) {
          console.error('Delete module failed:', err.message);
          if ('response' in err && err.response) {
            console.error('Response data:', err.response.data);
            console.error('Response status:', err.response.status);
            if (err.response.status === 403) {
              throw new Error('У вас недостаточно прав для удаления модуля. Убедитесь, что вы создатель курса.');
            }
          }
        }
        throw new Error('Неизвестная ошибка при удалении модуля');
      }
    }
  };

  const handleDeleteCourse = async (courseId: string, courseCreatorId: string) => {
    try {
      let accessToken = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId');
      if (!accessToken || !userId) {
        setError('Не авторизован. Пожалуйста, войдите.');
        return;
      }

      if (courseCreatorId !== userId) {
        setError('Вы не можете удалить этот курс, так как не являетесь его создателем.');
        return;
      }

      console.log('Attempting to delete course with id:', courseId);
      console.log('Using accessToken:', accessToken.substring(0, 20) + '...');
      console.log('Current userId:', userId);
      console.log('Course creatorId:', courseCreatorId);

      // Получаем модули курса
      const modules = await fetchModules(courseId);

      // Удаляем все модули
      for (const module of modules) {
        await deleteModule(module.id);
      }

      // Удаляем сам курс
      try {
        const response = await api.delete(`/api/courses/${courseId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: '*/*',
          },
        });

        if (response.status === 204) {
          setCourses((prevCourses) => prevCourses.filter((course) => course.id !== courseId));
          console.log(`Course with id ${courseId} deleted successfully`);
        }
      } catch (err: unknown) {
        if (err instanceof Error && 'response' in err && err.response?.status === 401) {
          accessToken = await refreshAccessToken();
          const retryResponse = await api.delete(`/api/courses/${courseId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: '*/*',
            },
          });

          if (retryResponse.status === 204) {
            setCourses((prevCourses) => prevCourses.filter((course) => course.id !== courseId));
            console.log(`Course with id ${courseId} deleted successfully after token refresh`);
          }
        } else {
          throw err;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        let errorMessage = `Ошибка при удалении курса: ${err.message}`;
        if ('response' in err && err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
          if (err.response.status === 403) {
            errorMessage = 'У вас недостаточно прав для удаления этого курса или его модулей.';
          } else if (err.response.status === 401) {
            errorMessage = 'Недействительный токен. Пожалуйста, войдите заново.';
          }
        }
        setError(errorMessage);
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
      <Header createCourse={() => navigate('/create-course')} />
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
                      handleDeleteCourse(course.id, course.uploadedUser.id);
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