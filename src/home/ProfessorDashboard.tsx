import React from 'react';
import Header from '../components/Header';

const ProfessorDashboard: React.FC = () => {
  return (
    <div>
      <Header /> 
      <div className="flex items-center justify-center bg-white mt-10">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-2 border-solid">
          <h2 className="text-2xl font-bold mb-6 text-center">Главное меню преподавателя</h2>
          <p className="text-center">Добро пожаловать, преподаватель!</p>
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;