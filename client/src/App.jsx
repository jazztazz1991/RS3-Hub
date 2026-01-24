import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Dashboard from './components/Dashboard/Dashboard';
import Calculators from './components/Calculators/Calculators';
import ArchaeologyCalculator from './components/Calculators/Archaeology/ArchaeologyCalculator';
import Navbar from './components/Navbar/Navbar';

function App() {
  const [serverStatus, setServerStatus] = useState('Checking server...');

  useEffect(() => {
    fetch('http://localhost:5000/')
      .then(res => res.text())
      .then(data => setServerStatus(data))
      .catch(() => setServerStatus('Server is offline'));
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calculators" element={<Calculators />} />
            <Route path="/calculators/archaeology" element={<ArchaeologyCalculator />} />
            {/* Will implement Daily Tasks later */}
            <Route path="/daily-tasks" element={<div style={{padding: '2rem'}}>Daily Tasks Coming Soon</div>} />
          </Routes>
          
          <section className="status-bar">
            <p>Backend Status: {serverStatus}</p>
          </section>
        </main>
      </div>
    </Router>
  )
}

export default App
