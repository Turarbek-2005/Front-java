import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import logo from '../assets/LogoWhite.png';
import profileLogo from '../assets/profileLogo.png';

interface Module {
  id: string;
  course: {
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
  };
  moduleType: 'TEXT' | 'VIDEO' | 'TEST';
  moduleNum: number;
  moduleTitle: string;
  text: string | null;
  video: { id: string; videoUrl: string } | null;
  test: any | null;
}

interface ModulesResponse {
  total: number;
  items: Module[];
}

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken || !id) {
          setError('Не авторизован или ID курса отсутствует.');
          setLoading(false);
          return;
        }

        const response = await api.get<ModulesResponse>(`/api/modules/course/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log('Response data from /api/modules/course/:id:', response.data);

        if (response.data && Array.isArray(response.data.items)) {
          setModules(response.data.items);
        } else {
          setError('Данные модулей не содержат массив в поле items');
          setModules([]);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(`Ошибка при загрузке модулей: ${err.message}`);
          console.error('Fetch modules failed:', err.message);
          if ('response' in err && err.response) {
            console.error('Response data:', err.response.data);
            console.error('Response status:', err.response.status);
            console.error('Response headers:', err.response.headers);
          }
        } else {
          setError('Неизвестная ошибка при загрузке модулей');
          console.error('Fetch modules failed:', err);
        }
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [id]);

  const handleNextModule = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    } else {
      alert('Курс завершен! Переход к тестированию.');
      navigate('/test'); // Пример перехода к тесту
    }
  };

  const currentModule = modules[currentModuleIndex];

  if (loading) return <p className="text-center mt-10 text-gray-600">Загрузка модулей...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;
  if (!currentModule) return <p className="text-center mt-10 text-gray-600">Модуль не найден.</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
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
      <div className="flex flex-1">
        {/* Боковая панель с модулями */}
        <aside className="w-64 bg-white p-4 shadow">
          <h2 className="text-lg font-bold mb-4">{currentModule.course.title}</h2>
          <p className="text-sm text-gray-600 mb-4">
            Прогресс курса: {currentModuleIndex + 1}/{modules.length}
          </p>
          <ul>
            {modules.map((module, index) => (
              <li
                key={module.id}
                className={`p-2 mb-2 rounded cursor-pointer ${
                  index === currentModuleIndex
                    ? 'bg-green-500 text-white'
                    : modules
                        .slice(0, currentModuleIndex)
                        .some((m) => m.id === module.id)
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-white text-gray-700'
                }`}
                onClick={() => setCurrentModuleIndex(index)}
              >
                Модуль {module.moduleNum}: {module.moduleTitle}
              </li>
            ))}
          </ul>
        </aside>

        {/* Контент модуля */}
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-4">{currentModule.moduleTitle}</h1>
          {currentModule.moduleType === 'TEXT' && currentModule.text && (
            <div
              className="bg-white p-4 rounded-lg shadow max-h-[70vh] overflow-y-auto"
            >
              <p>{currentModule.text}</p>
            </div>
          )}
          {currentModule.moduleType === 'VIDEO' && currentModule.video && (
            <div className="bg-white p-4 rounded-lg shadow">
              <iframe
                width="100%"
                height="400"
                src={currentModule.video.videoUrl}
                title={currentModule.moduleTitle}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
          {currentModule.moduleType === 'TEST' && currentModule.test && (
            <div className="bg-white p-4 rounded-lg shadow">
              <p>Тест: {JSON.stringify(currentModule.test)}</p>
            </div>
          )}
          <button
            onClick={handleNextModule}
            className="mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 flex items-center"
          >
            Следующий шаг
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </main>
      </div>
    </div>
  );
};

export default CourseDetail;