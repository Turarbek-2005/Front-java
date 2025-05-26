import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface ModuleForm {
  moduleTitle: string;
  moduleType: 'TEXT' | 'VIDEO' | 'TEST';
  text: string;
  videoFile: File | null;
  videoId: string;
  testId: string;
  testDocument: File | null;
}

interface CourseForm {
  title: string;
  description: string;
  approximateTime: string;
  image: File | null;
  modules: ModuleForm[];
}

const CreateCourse: React.FC = () => {
  const [formData, setFormData] = useState<CourseForm>({
    title: '',
    description: '',
    approximateTime: '',
    image: null,
    modules: [{ moduleTitle: '', moduleType: 'TEXT', text: '', videoFile: null, videoId: '', testId: '', testDocument: null }],
  });
  const [error, setError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    index?: number
  ) => {
    if (index === undefined) {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    } else {
      const newModules = [...formData.modules];
      if (e.target.name === 'moduleType') {
        newModules[index] = {
          ...newModules[index],
          [e.target.name]: e.target.value as 'TEXT' | 'VIDEO' | 'TEST',
          text: '',
          videoFile: null,
          videoId: '',
          testId: '',
          testDocument: null,
        };
      } else {
        newModules[index] = { ...newModules[index], [e.target.name]: e.target.value };
      }
      setFormData({ ...formData, modules: newModules });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, field: 'videoFile' | 'testDocument') => {
    if (e.target.files && e.target.files[0]) {
      const newModules = [...formData.modules];
      newModules[index] = { ...newModules[index], [field]: e.target.files[0] };
      setFormData({ ...formData, modules: newModules });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const addModule = () => {
    setFormData({
      ...formData,
      modules: [...formData.modules, { moduleTitle: '', moduleType: 'TEXT', text: '', videoFile: null, videoId: '', testId: '', testDocument: null }],
    });
  };

  const uploadVideo = async (videoFile: File) => {
    try {
      let accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Не авторизован. Пожалуйста, войдите.');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('file', videoFile);

      const response = await api.post('/api/modules/video/upload', formDataToSend, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
      });

      if (response.status === 201) {
        console.log('Video uploaded successfully:', response.data);
        return response.data.id;
      }
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err && err.response?.status === 403) {
        accessToken = await refreshAccessToken();
        const formDataToSend = new FormData();
        formDataToSend.append('file', videoFile);

        const retryResponse = await api.post('/api/modules/video/upload', formDataToSend, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
          },
        });

        if (retryResponse.status === 201) {
          console.log('Video uploaded successfully after token refresh:', retryResponse.data);
          return retryResponse.data.id;
        }
      }
      if (err instanceof Error) {
        console.error('Video upload failed:', err.message);
        if ('response' in err && err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
        }
        throw new Error(`Ошибка при загрузке видео: ${err.message}`);
      }
      throw new Error('Неизвестная ошибка при загрузке видео');
    }
  };

  const uploadTest = async (testDocument: File) => {
    try {
      let accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Не авторизован. Пожалуйста, войдите.');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('file', testDocument);

      const response = await api.post('/api/modules/tests/create-from-docx', formDataToSend, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
      });

      if (response.status === 201) {
        console.log('Test uploaded successfully:', response.data);
        return response.data.id;
      }
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err && err.response?.status === 403) {
        accessToken = await refreshAccessToken();
        const formDataToSend = new FormData();
        formDataToSend.append('file', testDocument);

        const retryResponse = await api.post('/api/modules/tests/create-from-docx', formDataToSend, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
          },
        });

        if (retryResponse.status === 201) {
          console.log('Test uploaded successfully after token refresh:', retryResponse.data);
          return retryResponse.data.id;
        }
      }
      if (err instanceof Error) {
        console.error('Test upload failed:', err.message);
        if ('response' in err && err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
        }
        throw new Error(`Ошибка при загрузке теста: ${err.message}`);
      }
      throw new Error('Неизвестная ошибка при загрузке теста');
    }
  };

  const createCourse = async () => {
    try {
      let accessToken = localStorage.getItem('accessToken');
      const userType = localStorage.getItem('userType');
      if (!accessToken || userType !== 'PROFESSOR') {
        setError('Не авторизован как профессор. Пожалуйста, войдите заново.');
        return;
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        approximateTime: formData.approximateTime,
      };

      const response = await api.post('/api/courses', courseData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (response.status === 201) {
        const newCourseId = response.data.id;
        setCourseId(newCourseId);
        console.log('Course created successfully, ID:', newCourseId);
        return newCourseId;
      }
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err && err.response?.status === 403) {
        accessToken = await refreshAccessToken();
        const courseData = {
          title: formData.title,
          description: formData.description,
          approximateTime: formData.approximateTime,
        };
        const retryResponse = await api.post('/api/courses', courseData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        if (retryResponse.status === 201) {
          const newCourseId = retryResponse.data.id;
          setCourseId(newCourseId);
          console.log('Course created successfully after token refresh, ID:', newCourseId);
          return newCourseId;
        }
      }
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
      return null;
    }
  };

  const uploadCourseImage = async (courseId: string) => {
    if (!formData.image) return;

    try {
      let accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Не авторизован. Пожалуйста, войдите.');
      }

      const imageData = new FormData();
      imageData.append('image', formData.image);

      const response = await api.post(`/api/courses/${courseId}/image`, imageData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
      });

      if (response.status === 200) {
        console.log('Course image uploaded successfully');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Ошибка при загрузке изображения: ${err.message}`);
        console.error('Upload image failed:', err.message);
        if ('response' in err && err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
        }
      } else {
        setError('Неизвестная ошибка при загрузке изображения');
        console.error('Upload image failed:', err);
      }
    }
  };

  const createModule = async (module: ModuleForm, courseId: string) => {
    try {
      let accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Не авторизован. Пожалуйста, войдите.');
      }

      let videoId = module.videoId;
      let testId = module.testId;

      if (module.moduleType === 'VIDEO' && module.videoFile) {
        videoId = await uploadVideo(module.videoFile);
      }
      if (module.moduleType === 'TEST' && module.testDocument) {
        testId = await uploadTest(module.testDocument);
      }

      const moduleData = {
        moduleTitle: module.moduleTitle,
        moduleType: module.moduleType,
        text: module.moduleType === 'TEXT' ? module.text : '',
        videoId: module.moduleType === 'VIDEO' ? videoId : '',
        testId: module.moduleType === 'TEST' ? testId : '',
      };

      const response = await api.post(`/api/modules/course/${courseId}`, moduleData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (response.status === 201) {
        console.log(`Module ${module.moduleTitle} created successfully`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Create module failed:', err.message);
        if ('response' in err && err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
          if (err.response.status === 403) {
            throw new Error('У вас недостаточно прав для создания модуля.');
          }
        }
        throw new Error(`Ошибка при создании модуля: ${err.message}`);
      }
      throw new Error('Неизвестная ошибка при создании модуля');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const newCourseId = await createCourse();
    if (!newCourseId) return;

    try {
      if (formData.image) {
        await uploadCourseImage(newCourseId);
      }
      for (const module of formData.modules) {
        await createModule(module, newCourseId);
      }
      navigate('/professor-dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Ошибка при создании модулей: ${err.message}`);
        console.error('Create modules failed:', err.message);
      } else {
        setError('Неизвестная ошибка при создании модулей');
        console.error('Create modules failed:', err);
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
            onChange={(e) => handleInputChange(e)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Описание</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) => handleInputChange(e)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Примерное время (например, 3:00)</label>
          <input
            type="text"
            name="approximateTime"
            value={formData.approximateTime}
            onChange={(e) => handleInputChange(e)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Обложка (изображение)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-2 border rounded"
          />
        </div>
        {formData.modules.map((module, index) => (
          <div key={index} className="mb-4 p-4 border rounded">
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Название модуля</label>
              <input
                type="text"
                name="moduleTitle"
                value={module.moduleTitle}
                onChange={(e) => handleInputChange(e, index)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Тип модуля</label>
              <select
                name="moduleType"
                value={module.moduleType}
                onChange={(e) => handleInputChange(e, index)}
                className="w-full p-2 border rounded"
              >
                <option value="TEXT">Текст</option>
                <option value="VIDEO">Видео</option>
                <option value="TEST">Тест</option>
              </select>
            </div>
            {module.moduleType === 'TEXT' && (
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Текст</label>
                <textarea
                  name="text"
                  value={module.text}
                  onChange={(e) => handleInputChange(e, index)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            )}
            {module.moduleType === 'VIDEO' && (
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Видео (файл, до 800MB)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, index, 'videoFile')}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            )}
            {module.moduleType === 'TEST' && (
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Документ теста (DOCX)</label>
                <input
                  type="file"
                  accept=".docx"
                  onChange={(e) => handleFileChange(e, index, 'testDocument')}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addModule}
          className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Добавить модуль
        </button>
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Сохранить
        </button>
      </form>
    </div>
  );
};

export default CreateCourse;