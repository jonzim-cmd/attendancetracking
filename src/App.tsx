import React from 'react';
import { Router, Route } from 'wouter';
import AttendanceAnalyzer from './pages/AttendanceAnalyzer';
import './index.css';

// Wouter Basis-Hook für GitHub Pages
const useHashLocation = (): [string, (to: string) => void] => {
  const [loc, setLoc] = React.useState(
    window.location.hash ? window.location.hash.replace('#', '') : '/'
  );

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash ? window.location.hash.replace('#', '') : '/';
      setLoc(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  return [loc, navigate];
};

const App: React.FC = () => {
  return (
    <Router hook={useHashLocation}>
      <div className="App">
        <Route path="/" component={AttendanceAnalyzer} />
        {/* Weitere Routen hier hinzufügen falls nötig */}
      </div>
    </Router>
  );
};

export default App;
