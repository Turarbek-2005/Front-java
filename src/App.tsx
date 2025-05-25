import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './authorization/Register';
import Login from './authorization/Login';
import StudentDashboard from './home/StudentDashboard';
import ProfessorDashboard from './home/ProfessorDashboard';
import CourseDetail from './modules/CourseDetail';

function App() {
  return (
  <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/professor-dashboard" element={<ProfessorDashboard />} />
      </Routes> 
    </Router>  
  );
}

export default App;