import React from 'react';
import AttendanceAnalyzer from './pages/AttendanceAnalyzer';
import './index.css'; // Tailwind CSS wird hier importiert

const App: React.FC = () => {
  return (
    <div className="App">
      <AttendanceAnalyzer />
    </div>
  );
};

export default App;