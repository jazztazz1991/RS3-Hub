import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css'
import { AuthProvider } from './context/AuthContext';
import { CharacterProvider } from './context/CharacterContext';
import { ReportProvider } from './context/ReportContext';

// Shell components — always loaded
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Footer from './components/Footer/Footer';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Lazy-loaded route components
const Landing = lazy(() => import('./components/Landing/Landing'));
const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));
const Changelog = lazy(() => import('./components/Changelog/Changelog'));
const NotFound = lazy(() => import('./components/NotFound/NotFound'));
const ComingSoon = lazy(() => import('./components/ComingSoon/ComingSoon'));

// Admin (internal, no sidebar link for regular users)
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const SupportDashboard = lazy(() => import('./components/Support/SupportDashboard'));

const BossHunt = lazy(() => import('./components/BossHunt/BossHunt'));

const QuestTracker = lazy(() => import('./components/QuestTracker'));
const QuestDetails = lazy(() => import('./components/QuestTracker/QuestDetails'));

const Calculators = lazy(() => import('./components/Calculators/Calculators'));
const ArchaeologyCalculator = lazy(() => import('./components/Calculators/Archaeology/ArchaeologyCalculator'));
const InventionCalculator = lazy(() => import('./components/Calculators/Invention/InventionCalculator'));
const PrayerCalculator = lazy(() => import('./components/Calculators/Prayer/PrayerCalculator'));
const MagicCalculator = lazy(() => import('./components/Calculators/Magic/MagicCalculator'));
const CookingCalculator = lazy(() => import('./components/Calculators/Cooking/CookingCalculator'));
const WoodcuttingCalculator = lazy(() => import('./components/Calculators/Woodcutting/WoodcuttingCalculator'));
const FletchingCalculator = lazy(() => import('./components/Calculators/Fletching/FletchingCalculator'));
const FishingCalculator = lazy(() => import('./components/Calculators/Fishing/FishingCalculator'));
const FiremakingCalculator = lazy(() => import('./components/Calculators/Firemaking/FiremakingCalculator'));
const MiningCalculator = lazy(() => import('./components/Calculators/Mining/MiningCalculator'));
const SmithingCalculator = lazy(() => import('./components/Calculators/Smithing/SmithingCalculator'));
const CraftingCalculator = lazy(() => import('./components/Calculators/Crafting/CraftingCalculator'));
const HerbloreCalculator = lazy(() => import('./components/Calculators/Herblore/HerbloreCalculator'));
const AgilityCalculator = lazy(() => import('./components/Calculators/Agility/AgilityCalculator'));
const ThievingCalculator = lazy(() => import('./components/Calculators/Thieving/ThievingCalculator'));
const SlayerCalculator = lazy(() => import('./components/Calculators/Slayer/SlayerCalculator'));
const FarmingCalculator = lazy(() => import('./components/Calculators/Farming/FarmingCalculator'));
const RunecraftingCalculator = lazy(() => import('./components/Calculators/Runecrafting/RunecraftingCalculator'));
const HunterCalculator = lazy(() => import('./components/Calculators/Hunter/HunterCalculator'));
const ConstructionCalculator = lazy(() => import('./components/Calculators/Construction/ConstructionCalculator'));
const SummoningCalculator = lazy(() => import('./components/Calculators/Summoning/SummoningCalculator'));
const DungeoneeringCalculator = lazy(() => import('./components/Calculators/Dungeoneering/DungeoneeringCalculator'));
const DivinationCalculator = lazy(() => import('./components/Calculators/Divination/DivinationCalculator'));
const NecromancyCalculator = lazy(() => import('./components/Calculators/Necromancy/NecromancyCalculator'));
const UrnsCalculator = lazy(() => import('./components/Calculators/Tools/UrnsCalculator'));
const GoalCalculator = lazy(() => import('./components/Calculators/Endgame/GoalCalculator'));

function AppContent() {
  const location = useLocation();
  return (
    <div className="app-container">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main key={location.pathname}>
          <Suspense fallback={<div className="route-loading">Loading...</div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/changelog" element={<Changelog />} />

              {/* Feature 1 — Calculators */}
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
              <Route path="/calculators/endgame" element={<GoalCalculator />} />

              {/* Feature 2 — Boss Hunt */}
              <Route path="/boss-hunt" element={<BossHunt />} />

              {/* Feature 3 — Quests */}
              <Route path="/quests" element={<QuestTracker />} />
              <Route path="/quests/:questTitle" element={<QuestDetails />} />

              {/* Internal admin (no sidebar link for regular users) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/support" element={<SupportDashboard />} />
              </Route>

              {/* Hidden for launch — show Coming Soon */}
              <Route path="/dashboard" element={<ComingSoon />} />
              <Route path="/guides/*" element={<ComingSoon />} />
              <Route path="/daily-tasks" element={<ComingSoon />} />
              <Route path="/loot" element={<ComingSoon />} />
              <Route path="/xp-tracker" element={<ComingSoon />} />
              <Route path="/farm-timers" element={<ComingSoon />} />
              <Route path="/groups/*" element={<ComingSoon />} />
              <Route path="/methods/*" element={<ComingSoon />} />
              <Route path="/items/*" element={<ComingSoon />} />
              <Route path="/wiki/*" element={<ComingSoon />} />
              <Route path="/wiki-sandbox" element={<ComingSoon />} />
              <Route path="/quest-preview/*" element={<ComingSoon />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CharacterProvider>
        <ReportProvider>
          <Router>
            <AppContent />
          </Router>
        </ReportProvider>
      </CharacterProvider>
    </AuthProvider>
  );
}

export default App
