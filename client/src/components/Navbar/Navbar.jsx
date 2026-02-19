import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReportCalls } from '../../context/ReportContext';
import ReportModal from '../Common/ReportModal';
import SuggestionModal from '../Common/SuggestionModal';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { reportContext } = useReportCalls();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/">RS3 Efficiency Hub</Link>
        </div>
        <ul className="navbar-links">
          {user ? (
            <>
              <li><button onClick={() => setIsReportModalOpen(true)} className="report-btn">Report Issue</button></li>
              <li><button onClick={() => setIsSuggestionModalOpen(true)} className="suggestion-btn">Suggestion</button></li>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/calculators">Calculators</Link></li>
              <li><Link to="/guides">Guides</Link></li>
              <li><Link to="/quests">Quests</Link></li>
              <li><Link to="/daily-tasks">Daily Tasks</Link></li>
              {user.isAdmin && <li><Link to="/admin">Admin</Link></li>}
              <li><span className="user-greeting">Hi, {user.username || user.email}</span></li>
              <li><button onClick={logout} className="logout-btn">Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        contextData={reportContext}
        defaultType="bug"
      />
      <SuggestionModal 
        isOpen={isSuggestionModalOpen} 
        onClose={() => setIsSuggestionModalOpen(false)} 
        contextData={reportContext}
      />
    </>
  );
};

export default Navbar;
