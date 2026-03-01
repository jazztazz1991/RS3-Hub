import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReportCalls } from '../../context/ReportContext';
import { SIDEBAR_ITEMS } from '../../data/common/sidebarItems';
import ReportModal from '../Common/ReportModal';
import SuggestionModal from '../Common/SuggestionModal';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { reportContext } = useReportCalls();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    close();
    logout();
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to={user ? "/dashboard" : "/"} onClick={close}>
            <img src="/images/logos/Runehublogo.png" alt="RuneHub" className="navbar-logo-img" />
            Play your way
          </Link>
        </div>

        {/* Hamburger */}
        <button
          className={`hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <ul className={`navbar-links${menuOpen ? ' mobile-open' : ''}`}>
          {/* Sidebar items — mobile hamburger only (filtered by auth) */}
          {SIDEBAR_ITEMS
            .filter(item => !item.auth || user)
            .map(item => (
              <li key={item.path} className="sidebar-mobile-item">
                <Link to={item.path} onClick={close}>{item.icon} {item.label}</Link>
              </li>
            ))}
          {user ? (
            <>
              <li><button onClick={() => { setIsReportModalOpen(true); close(); }} className="report-btn">Report Issue</button></li>
              <li><button onClick={() => { setIsSuggestionModalOpen(true); close(); }} className="suggestion-btn">Suggestion</button></li>
              {['admin', 'manager', 'co-owner', 'owner'].includes(user.role) ? (
                <li><Link to="/admin" onClick={close}>Admin</Link></li>
              ) : (
                <li><Link to="/support" onClick={close}>Support</Link></li>
              )}
              <li><span className="user-greeting">Hi, {user.username || user.email}</span></li>
              <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" onClick={close}>Login</Link></li>
              <li><Link to="/register" onClick={close}>Register</Link></li>
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
