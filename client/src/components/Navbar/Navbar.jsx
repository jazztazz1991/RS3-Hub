import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">RS3 Efficiency Hub</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/calculators">Calculators</Link></li>
        <li><Link to="/daily-tasks">Daily Tasks</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
