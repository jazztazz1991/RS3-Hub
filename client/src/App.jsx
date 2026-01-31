import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import { AuthProvider } from './context/AuthContext';
import { CharacterProvider } from './context/CharacterContext';
import Dashboard from './components/Dashboard/Dashboard';
import Calculators from './components/Calculators/Calculators';
import ArchaeologyCalculator from './components/Calculators/Archaeology/ArchaeologyCalculator';
import InventionCalculator from './components/Calculators/Invention/InventionCalculator';
import Navbar from './components/Navbar/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  const [serverStatus, setServerStatus] = useState('Checking server...');

  useEffect(() => {
    fetch('http://localhost:5000/')
      .then(res => res.text())
      .then(data => setServerStatus(data))
      .catch(() => setServerStatus('Server is offline'));
  }, []);

  return (
    <AuthProvider>
      <CharacterProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            
            <main>
              <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/calculators" element={<Calculators />} />
                <Route path="/calculators/archaeology" element={<ArchaeologyCalculator />} />
                <Route path="/calculators/invention" element={<InventionCalculator />} />
                <Route path="/daily-tasks" element={<div style={{padding: '2rem'}}>Daily Tasks Coming Soon</div>} />
              </Route>
            </Routes>
            
            <section className="status-bar">
              <p>Backend Status: {serverStatus}</p>
            </section>
          </main>
        </div>
      </Router>
      </CharacterProvider>
    </AuthProvider>
  )
}

export default App
