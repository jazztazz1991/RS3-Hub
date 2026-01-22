import React from 'react';
import { Link } from 'react-router-dom';
import { mockSkills } from '../../data/mockData';
import './Calculators.css';

const Calculators = () => {
  return (
    <div className="calculators-container">
      <h2>Skill Calculators</h2>
      <p>Select a skill to optimize your efficiency.</p>
      
      <div className="calculators-grid">
        {mockSkills.map(skill => (
          <Link to={`/calculators/${skill.name.toLowerCase()}`} key={skill.id} className="calculator-card">
            <div className="calculator-icon">
              {/* Placeholder for icon - using first letter for now */}
              {skill.name.charAt(0)}
            </div>
            <div className="calculator-info">
              <h3>{skill.name}</h3>
              <span className="calc-status">Calculator Ready</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Calculators;
