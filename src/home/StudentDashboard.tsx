import React from 'react';
import logo from '../assets/Logo.png';

const StudentDashboard: React.FC = () => {
  return (
    <div>
      <img className="mt-10 ml-10" src={logo} alt="Logo" />
      <div className="flex items-center justify-center bg-white">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-2 border-solid">
          <h2 className="text-2xl font-bold mb-6 text-center">Главное меню студента</h2>
          <p className="text-center">Добро пожаловать, Адиль гей!</p>
          {/* Здесь можно добавить функционал для студента */}
        </div>
      </div>
    </div>
  );
};


export default StudentDashboard;