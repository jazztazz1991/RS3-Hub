import React from 'react';
import { Link } from 'react-router-dom';
import { mockSkills } from '../../data/common/mockData';
import SkillIcon from '../Common/SkillIcon';
import './Calculators.css';

const Calculators = () => {
  return (
    <div className="calculators-container">
      <h2>Skill Calculators</h2>
      <p>Select a skill to optimize your efficiency.</p>
      
      <div className="calculators-grid">
        {mockSkills
          .filter(skill => !['Attack', 'Defence', 'Strength', 'Constitution', 'Ranged'].includes(skill.name))
          .map(skill => (
          <Link to={`/calculators/${skill.name.toLowerCase()}`} key={skill.id} className="calculator-card">
            <div className="calculator-icon">
              <SkillIcon skillName={skill.name} className="calculator-skill-img" />
            </div>
            <div className="calculator-info">
              <h3>{skill.name}</h3>
            </div>
          </Link>
        ))}
      </div>

      <h2 style={{marginTop: '3rem'}}>Tools</h2>
      <div className="calculators-grid">
         <Link to="/calculators/urns" className="calculator-card">
            <div className="calculator-icon">
              U
            </div>
            <div className="calculator-info">
              <h3>Urns Calculator</h3>
            </div>
          </Link>
      </div>
    </div>
  );
};

export default Calculators;
