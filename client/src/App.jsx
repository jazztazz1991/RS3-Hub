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
import WildyNotification from './components/WildyEvents/WildyNotification';

// Lazy-loaded route components
const Landing = lazy(() => import('./components/Landing/Landing'));
const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));
const Changelog = lazy(() => import('./components/Changelog/Changelog'));
const NotFound = lazy(() => import('./components/NotFound/NotFound'));

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const SupportDashboard = lazy(() => import('./components/Support/SupportDashboard'));
const DailyTasks = lazy(() => import('./components/DailyTasks/DailyTasks'));

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

const Guides = lazy(() => import('./components/Guides/Guides'));
const NecromancyGuide = lazy(() => import('./components/Guides/NecromancyGuide'));
const ThievingGuide = lazy(() => import('./components/Guides/ThievingGuide'));
const FarmingGuide = lazy(() => import('./components/Guides/Farming/FarmingGuide'));
const ArchaeologyGuide = lazy(() => import('./components/Guides/ArchaeologyGuide'));
const DivinationGuide = lazy(() => import('./components/Guides/DivinationGuide'));
const FishingGuide = lazy(() => import('./components/Guides/FishingGuide'));
const WoodcuttingGuide = lazy(() => import('./components/Guides/WoodcuttingGuide'));
const MiningGuide = lazy(() => import('./components/Guides/MiningGuide'));
const FiremakingGuide = lazy(() => import('./components/Guides/FiremakingGuide'));
const HerbloreGuide = lazy(() => import('./components/Guides/Herblore/HerbloreGuide'));
const AgilityGuide = lazy(() => import('./components/Guides/Agility/AgilityGuide'));
const ConstructionGuide = lazy(() => import('./components/Guides/Construction/ConstructionGuide'));
const CookingGuide = lazy(() => import('./components/Guides/Cooking/CookingGuide'));
const CraftingGuide = lazy(() => import('./components/Guides/Crafting/CraftingGuide'));
const FletchingGuide = lazy(() => import('./components/Guides/Fletching/FletchingGuide'));
const SlayerGuide = lazy(() => import('./components/Guides/Slayer/SlayerGuide'));
const PrayerGuide = lazy(() => import('./components/Guides/PrayerGuide'));
const SummoningGuide = lazy(() => import('./components/Guides/SummoningGuide'));
const MagicGuide = lazy(() => import('./components/Guides/MagicGuide'));
const SmithingGuide = lazy(() => import('./components/Guides/SmithingGuide'));
const RunecraftingGuide = lazy(() => import('./components/Guides/RunecraftingGuide'));
const HunterGuide = lazy(() => import('./components/Guides/HunterGuide'));
const InventionGuide = lazy(() => import('./components/Guides/InventionGuide'));
const DungeoneeringGuide = lazy(() => import('./components/Guides/DungeoneeringGuide'));
const RangedGuide = lazy(() => import('./components/Guides/Ranged/RangedGuide'));

function AppContent() {
  const location = useLocation();
  return (
    <div className="app-container">
      <WildyNotification />
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

              {/* Public — Calculators (stateless tools) */}
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

              {/* Public — Guides (static content) */}
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
              <Route path="/guides/ranged" element={<RangedGuide />} />

              {/* Public — Quests (read-only browsing) */}
              <Route path="/quests" element={<QuestTracker />} />
              <Route path="/quests/:questTitle" element={<QuestDetails />} />

              {/* Protected — features that save to database */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/support" element={<SupportDashboard />} />
                <Route path="/daily-tasks" element={<DailyTasks />} />
              </Route>

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
