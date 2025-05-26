import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';

interface Test {
  id?: string;
  questions?: string[];
  answers?: string[];
  body?: string; 
}

interface ParsedQuestion {
  question: string;
  ans_variants: Record<string, string>;
  question_num: number;
  correct_var: string;
}

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
  test: Test | null;
}

interface ModulesResponse {
  total: number;
  items: Module[];
}

interface TestResults {
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  gradeData: {
    courseMaxTest: number;
    userGrade: number;
  };
}

const TestComponent: React.FC<{
  test: Test;
  courseId: string;
  courseTitle: string;
  onComplete: () => void;
}> = ({ test, courseId, courseTitle, onComplete }) => {
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<Record<number, Array<[string, string]>>>({});

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (test.body) {
      try {
        const parsedQuestions: ParsedQuestion[] = JSON.parse(test.body);
        setQuestions(parsedQuestions);
        
        const shuffledAnswersMap: Record<number, Array<[string, string]>> = {};
        parsedQuestions.forEach(question => {
          const answersArray = Object.entries(question.ans_variants);
          shuffledAnswersMap[question.question_num] = shuffleArray(answersArray);
        });
        setShuffledAnswers(shuffledAnswersMap);
      } catch (error) {
        console.error('Ошибка парсинга вопросов:', error);
      }
    }
  }, [test]);

  const handleAnswerSelect = (questionNum: number, variant: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionNum]: variant
    }));
  };

  const calculateResults = (): TestResults => {
    let correctAnswers = 0;
    questions.forEach(question => {
      if (selectedAnswers[question.question_num] === question.correct_var) {
        correctAnswers++;
      }
    });
    return {
      correctAnswers,
      totalQuestions: questions.length,
      percentage: Math.round((correctAnswers / questions.length) * 100),
      gradeData: {
        courseMaxTest: questions.length,
        userGrade: correctAnswers
      }
    };
  };

  const handleSubmitTest = async () => {
    setIsLoading(true);
    const testResults = calculateResults();
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      if (accessToken) {
        await api.post(`/api/test-grades/${courseId}`, testResults.gradeData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      
      setResults(testResults);
      setIsCompleted(true);
    } catch (error) {
      console.error('Ошибка при сохранении результатов:', error);
      setResults(testResults);
      setIsCompleted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartTest = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setIsCompleted(false);
    setResults(null);
    
    const shuffledAnswersMap: Record<number, Array<[string, string]>> = {};
    questions.forEach(question => {
      const answersArray = Object.entries(question.ans_variants);
      shuffledAnswersMap[question.question_num] = shuffleArray(answersArray);
    });
    setShuffledAnswers(shuffledAnswersMap);
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-gray-600">Загрузка теста...</p>
      </div>
    );
  }

  if (isCompleted && results) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 text-3xl ${
            results.percentage >= 70 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {results.percentage >= 70 ? '✅' : '❌'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Тест завершен!</h2>
          <p className="text-gray-600">{courseTitle}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-green-600">{results.correctAnswers}</div>
              <div className="text-sm text-gray-600">Правильных</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{results.totalQuestions}</div>
              <div className="text-sm text-gray-600">Всего</div>
            </div>
            <div>
              <div className={`text-xl font-bold ${
                results.percentage >= 70 ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.percentage}%
              </div>
              <div className="text-sm text-gray-600">Результат</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRestartTest}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            Пересдать
          </button>
          <button
            onClick={onComplete}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Продолжить курс
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Вопрос {currentQuestion + 1} из {questions.length}
          </h2>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {question.question}
        </h3>

        <div className="space-y-2 mb-6">
          {shuffledAnswers[question.question_num]?.map(([varKey, varText]) => (
            <label
              key={varKey}
              className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAnswers[question.question_num] === varKey
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.question_num}`}
                value={varKey}
                checked={selectedAnswers[question.question_num] === varKey}
                onChange={() => handleAnswerSelect(question.question_num, varKey)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                selectedAnswers[question.question_num] === varKey
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
              }`}>
                {selectedAnswers[question.question_num] === varKey && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span className="text-gray-900">{varText}</span>
            </label>
          )) || Object.entries(question.ans_variants).map(([varKey, varText]) => (
            <label
              key={varKey}
              className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAnswers[question.question_num] === varKey
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.question_num}`}
                value={varKey}
                checked={selectedAnswers[question.question_num] === varKey}
                onChange={() => handleAnswerSelect(question.question_num, varKey)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                selectedAnswers[question.question_num] === varKey
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
              }`}>
                {selectedAnswers[question.question_num] === varKey && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span className="text-gray-900">{varText}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Назад
          </button>

          <div className="text-sm text-gray-600">
            Отвечено: {Object.keys(selectedAnswers).length}/{questions.length}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmitTest}
              disabled={isLoading || Object.keys(selectedAnswers).length < questions.length}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Сохранение...
                </>
              ) : (
                'Завершить тест'
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Далее →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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
      alert('Курс завершен!');
      navigate('/courses');
    }
  };

  const handleTestComplete = () => {
    handleNextModule();
  };

  const currentModule = modules[currentModuleIndex];

  if (loading) return <p className="text-center mt-10 text-gray-600">Загрузка модулей...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;
  if (!currentModule) return <p className="text-center mt-10 text-gray-600">Модуль не найден.</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1">
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
                    : index < currentModuleIndex
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-white text-gray-700 opacity-60'
                }`}
                onClick={() => {
                  if (index <= currentModuleIndex) {
                    setCurrentModuleIndex(index);
                  }
                }}
              >
                <span className="text-xs">
                  {module.moduleType === 'TEXT' }
                  {module.moduleType === 'VIDEO' }
                  {module.moduleType === 'TEST' }
                </span>{' '}
                Модуль {module.moduleNum}: {module.moduleTitle}
              </li>
            ))}
          </ul>
        </aside>
        
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-4">{currentModule.moduleTitle}</h1>
          
          {currentModule.moduleType === 'TEXT' && currentModule.text && (
            <div className="bg-white p-6 rounded-lg shadow max-h-[70vh] overflow-y-auto">
              <div className="prose max-w-none">
                {currentModule.text.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
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
                className="rounded"
              ></iframe>
            </div>
          )}
          
          {currentModule.moduleType === 'TEST' && currentModule.test && (
            <TestComponent
              test={currentModule.test}
              courseId={currentModule.course.id}
              courseTitle={currentModule.course.title}
              onComplete={handleTestComplete}
            />
          )}
          
          {currentModule.moduleType !== 'TEST' && (
            <button
              onClick={handleNextModule}
              className="mt-6 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 flex items-center gap-2 transition-colors"
            >
              {currentModuleIndex === modules.length - 1 ? 'Завершить курс' : 'Следующий шаг'} →
            </button>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseDetail;