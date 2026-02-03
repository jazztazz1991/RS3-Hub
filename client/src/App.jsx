import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import { AuthProvider } from './context/AuthContext';
import { CharacterProvider } from './context/CharacterContext';
import Dashboard from './components/Dashboard/Dashboard';
import Calculators from './components/Calculators/Calculators';
import ArchaeologyCalculator from './components/Calculators/Archaeology/ArchaeologyCalculator';
import InventionCalculator from './components/Calculators/Invention/InventionCalculator';
import PrayerCalculator from './components/Calculators/Prayer/PrayerCalculator';
import MagicCalculator from './components/Calculators/Magic/MagicCalculator';
import CookingCalculator from './components/Calculators/Cooking/CookingCalculator';
import WoodcuttingCalculator from './components/Calculators/Woodcutting/WoodcuttingCalculator';
import FletchingCalculator from './components/Calculators/Fletching/FletchingCalculator';
import FishingCalculator from './components/Calculators/Fishing/FishingCalculator';
import FiremakingCalculator from './components/Calculators/Firemaking/FiremakingCalculator';
import Navbar from './components/Navbar/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import WildyNotification from './components/WildyEvents/WildyNotification';

function App() {
  const [serverStatus, setServerStatus] = useState('Checking server...');
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:5000');

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then(res => res.text())
      .then(data => setServerStatus(data))
      .catch(() => setServerStatus('Server is offline'));
  }, []);

  return (
    <AuthProvider>
      <CharacterProvider>
        <Router>
          <div className="app-container">
            <WildyNotification />
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
                <Route path="/calculators/prayer" element={<PrayerCalculator />} />
                <Route path="/calculators/magic" element={<MagicCalculator />} />
                <Route path="/calculators/cooking" element={<CookingCalculator />} />
                <Route path="/calculators/woodcutting" element={<WoodcuttingCalculator />} />
                <Route path="/calculators/fletching" element={<FletchingCalculator />} />
                <Route path="/calculators/fishing" element={<FishingCalculator />} />
                <Route path="/calculators/firemaking" element={<FiremakingCalculator />} />
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
