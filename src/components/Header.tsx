import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/LogoWhite.png';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const userType = localStorage.getItem('userType') as 'STUDENT' | 'PROFESSOR' | null;

  const handleLogoClick = () => {
    if (userType === 'STUDENT') {
      navigate('/student-dashboard');
    } else if (userType === 'PROFESSOR') {
      navigate('/professor-dashboard');
    }
  };

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-2" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="Logo" />
      </div>

    </header>
  );
};

export default Header;