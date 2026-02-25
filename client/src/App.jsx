import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import { AuthProvider } from './context/AuthContext';
import { CharacterProvider } from './context/CharacterContext';
import { ReportProvider } from './context/ReportContext';
import Dashboard from './components/Dashboard/Dashboard';
import DailyTasks from './components/DailyTasks/DailyTasks';
import Calculators from './components/Calculators/Calculators';
import ArchaeologyCalculator from './components/Calculators/Archaeology/ArchaeologyCalculator';
import InventionCalculator from './components/Calculators/Invention/InventionCalculator';
import PrayerCalculator from './components/Calculators/Prayer/PrayerCalculator';
import MagicCalculator from './components/Calculators/Magic/MagicCalculator';
import CookingCalculator from './components/Calculators/Cooking/CookingCalculator';
import WoodcuttingCalculator from './components/Calculators/Woodcutting/WoodcuttingCalculator';
import FletchingCalculator from './components/Calculators/Fletching/FletchingCalculator';
import FishingCalculator from './components/Calculators/Fishing/FishingCalculator';
import Guides from './components/Guides/Guides';
import NecromancyGuide from './components/Guides/NecromancyGuide';
import ThievingGuide from './components/Guides/ThievingGuide';
import FarmingGuide from './components/Guides/Farming/FarmingGuide';
import ArchaeologyGuide from './components/Guides/ArchaeologyGuide';
import DivinationGuide from './components/Guides/DivinationGuide';
import FishingGuide from './components/Guides/FishingGuide';
import WoodcuttingGuide from './components/Guides/WoodcuttingGuide';
import MiningGuide from './components/Guides/MiningGuide';
import FiremakingGuide from './components/Guides/FiremakingGuide';
import FiremakingCalculator from './components/Calculators/Firemaking/FiremakingCalculator';
import MiningCalculator from './components/Calculators/Mining/MiningCalculator';
import SmithingCalculator from './components/Calculators/Smithing/SmithingCalculator';
import CraftingCalculator from './components/Calculators/Crafting/CraftingCalculator';
import HerbloreCalculator from './components/Calculators/Herblore/HerbloreCalculator';
import HerbloreGuide from './components/Guides/Herblore/HerbloreGuide';
import AgilityGuide from './components/Guides/Agility/AgilityGuide';
import ConstructionGuide from './components/Guides/Construction/ConstructionGuide';
import CookingGuide from './components/Guides/Cooking/CookingGuide';
import CraftingGuide from './components/Guides/Crafting/CraftingGuide';
import FletchingGuide from './components/Guides/Fletching/FletchingGuide';
import SlayerGuide from './components/Guides/Slayer/SlayerGuide';
import AgilityCalculator from './components/Calculators/Agility/AgilityCalculator';
import ThievingCalculator from './components/Calculators/Thieving/ThievingCalculator';
import SlayerCalculator from './components/Calculators/Slayer/SlayerCalculator';
import FarmingCalculator from './components/Calculators/Farming/FarmingCalculator';
import RunecraftingCalculator from './components/Calculators/Runecrafting/RunecraftingCalculator';
import HunterCalculator from './components/Calculators/Hunter/HunterCalculator';
import ConstructionCalculator from './components/Calculators/Construction/ConstructionCalculator';
import SummoningCalculator from './components/Calculators/Summoning/SummoningCalculator';
import DungeoneeringCalculator from './components/Calculators/Dungeoneering/DungeoneeringCalculator';
import DivinationCalculator from './components/Calculators/Divination/DivinationCalculator';
import NecromancyCalculator from './components/Calculators/Necromancy/NecromancyCalculator';
import UrnsCalculator from './components/Calculators/Tools/UrnsCalculator';
import Navbar from './components/Navbar/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import WildyNotification from './components/WildyEvents/WildyNotification';
import QuestTracker from './components/QuestTracker';
import QuestDetails from './components/QuestTracker/QuestDetails';
import AdminDashboard from './components/Admin/AdminDashboard';
import SupportDashboard from './components/Support/SupportDashboard';
import Landing from './components/Landing/Landing';
import NotFound from './components/NotFound/NotFound';
import Changelog from './components/Changelog/Changelog';
import Footer from './components/Footer/Footer';
import PrayerGuide from './components/Guides/PrayerGuide';
import SummoningGuide from './components/Guides/SummoningGuide';
import MagicGuide from './components/Guides/MagicGuide';
import SmithingGuide from './components/Guides/SmithingGuide';
import RunecraftingGuide from './components/Guides/RunecraftingGuide';
import HunterGuide from './components/Guides/HunterGuide';
import InventionGuide from './components/Guides/InventionGuide';
import DungeoneeringGuide from './components/Guides/DungeoneeringGuide';

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
        <ReportProvider>
        <Router>
          <div className="app-container">
            <WildyNotification />
            <Navbar />
            
            <main>
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/changelog" element={<Changelog />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/support" element={<SupportDashboard />} />
                <Route path="/quests" element={<QuestTracker />} />
                <Route path="/quests/:questTitle" element={<QuestDetails />} />
                <Route path="/calculators" element={<Calculators />} />
                <Route path="/calculators/archaeology" element={<ArchaeologyCalculator />} />
                <Route path="/calculators/invention" element={<InventionCalculator />} />
                <Route path="/calculators/prayer" element={<PrayerCalculator />} />
                <Route path="/calculators/magic" element={<MagicCalculator />} />
                <Route path="/calculators/cooking" element={<CookingCalculator />} />
                <Route path="/calculators/woodcutting" element={<WoodcuttingCalculator />} />
                <Route path="/calculators/fletching" element={<FletchingCalculator />} />
                <Route path="/calculators/fishing" element={<FishingCalculator />} />
                <Route path="/guides" element={<Guides />} />
                <Route path="/guides/necromancy" element={<NecromancyGuide />} />
                <Route path="/guides/thieving" element={<ThievingGuide />} />
                <Route path="/guides/farming" element={<FarmingGuide />} />
                <Route path="/guides/archaeology" element={<ArchaeologyGuide />} />
                <Route path="/guides/divination" element={<DivinationGuide />} />
                <Route path="/guides/fishing" element={<FishingGuide />} />
                <Route path="/guides/woodcutting" element={<WoodcuttingGuide />} />
                <Route path="/guides/mining" element={<MiningGuide />} />
                <Route path="/guides/firemaking" element={<FiremakingGuide />} />
                <Route path="/guides/herblore" element={<HerbloreGuide />} />
                <Route path="/guides/agility" element={<AgilityGuide />} />
                <Route path="/guides/construction" element={<ConstructionGuide />} />
                <Route path="/guides/cooking" element={<CookingGuide />} />
                <Route path="/guides/crafting" element={<CraftingGuide />} />
                <Route path="/guides/fletching" element={<FletchingGuide />} />
                <Route path="/guides/slayer" element={<SlayerGuide />} />
                <Route path="/guides/prayer" element={<PrayerGuide />} />
                <Route path="/guides/summoning" element={<SummoningGuide />} />
                <Route path="/guides/magic" element={<MagicGuide />} />
                <Route path="/guides/smithing" element={<SmithingGuide />} />
                <Route path="/guides/runecrafting" element={<RunecraftingGuide />} />
                <Route path="/guides/hunter" element={<HunterGuide />} />
                <Route path="/guides/invention" element={<InventionGuide />} />
                <Route path="/guides/dungeoneering" element={<DungeoneeringGuide />} />
                <Route path="/calculators/firemaking" element={<FiremakingCalculator />} />
                <Route path="/calculators/mining" element={<MiningCalculator />} />
                <Route path="/calculators/smithing" element={<SmithingCalculator />} />
                <Route path="/calculators/crafting" element={<CraftingCalculator />} />
                <Route path="/calculators/herblore" element={<HerbloreCalculator />} />
                <Route path="/calculators/agility" element={<AgilityCalculator />} />
                <Route path="/calculators/thieving" element={<ThievingCalculator />} />
                <Route path="/calculators/slayer" element={<SlayerCalculator />} />
                <Route path="/calculators/farming" element={<FarmingCalculator />} />
                <Route path="/calculators/runecrafting" element={<RunecraftingCalculator />} />
                <Route path="/calculators/hunter" element={<HunterCalculator />} />
                <Route path="/calculators/construction" element={<ConstructionCalculator />} />
                <Route path="/calculators/summoning" element={<SummoningCalculator />} />
                <Route path="/calculators/dungeoneering" element={<DungeoneeringCalculator />} />
                <Route path="/calculators/divination" element={<DivinationCalculator />} />
                <Route path="/calculators/necromancy" element={<NecromancyCalculator />} />
                <Route path="/calculators/urns" element={<UrnsCalculator />} />
                <Route path="/daily-tasks" element={<DailyTasks />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <section className="status-bar">
              <p>Backend Status: {serverStatus}</p>
            </section>
          </main>
          <Footer />
        </div>
        </Router>
        </ReportProvider>
      </CharacterProvider>
    </AuthProvider>
  )
}

export default App
