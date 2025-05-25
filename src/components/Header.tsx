import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/LogoWhite.png';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = localStorage.getItem('userType') as 'STUDENT' | 'PROFESSOR' | null;

  const handleLogoClick = () => {
    if (userType === 'STUDENT') {
      navigate('/student-dashboard');
    } else if (userType === 'PROFESSOR') {
      navigate('/professor-dashboard');
    }
  };

  const handleCreateCourse = () => {
    navigate('/create-course');
  };

  const showCreateCourseButton = userType === 'PROFESSOR' && location.pathname === '/professor-dashboard';

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-2" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="Logo" />
      </div>
      {showCreateCourseButton && (
        <button
          onClick={handleCreateCourse}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-10"
        >
          Создать курс
        </button>
      )}
    </header>
  );
};

export default Header;  