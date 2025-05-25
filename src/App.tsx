import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Register from './authorization/Register';
import Login from './authorization/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}


export default App;