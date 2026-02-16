import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">RS3 Efficiency Hub</Link>
      </div>
      <ul className="navbar-links">
        {user ? (
          <>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/calculators">Calculators</Link></li>
            <li><Link to="/quests">Quests</Link></li>
            <li><Link to="/daily-tasks">Daily Tasks</Link></li>
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
  );
};

export default Navbar;
