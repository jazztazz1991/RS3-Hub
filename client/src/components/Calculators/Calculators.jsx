import React from 'react';
import { Link } from 'react-router-dom';
import { mockSkills } from '../../data/common/mockData';
import SkillIcon from '../Common/SkillIcon';
import './Calculators.css';

const EXCLUDED = ['Attack', 'Defence', 'Strength', 'Constitution', 'Ranged'];

const TOOLS = [
    { name: 'Urns Calculator', path: '/calculators/urns', icon: '⚗' },
];

const skillCalcs = mockSkills.filter(s => !EXCLUDED.includes(s.name));

const Calculators = () => (
    <div className="calcs-hub">
        <div className="calcs-hub-header">
            <h2>Skill Calculators</h2>
            <p>Select a skill to calculate XP, levels, and optimal methods.</p>
            <span className="calcs-count">{skillCalcs.length} calculators available</span>
        </div>

        <div className="calcs-hub-grid">
            {skillCalcs.map(skill => (
                <Link
                    to={`/calculators/${skill.name.toLowerCase()}`}
                    key={skill.id}
                    className="calcs-hub-card"
                >
                    <SkillIcon skillName={skill.name} className="calcs-skill-icon" />
                    <div className="calcs-card-body">
                        <span className="calcs-card-name">{skill.name}</span>
                        <span className="calcs-card-sub">XP &amp; Levels</span>
                    </div>
                </Link>
            ))}
        </div>

        <div className="calcs-tools-header">
            <h3>Tools</h3>
        </div>

        <div className="calcs-hub-grid">
            {TOOLS.map(tool => (
                <Link to={tool.path} key={tool.name} className="calcs-hub-card">
                    <span className="calcs-tool-icon">{tool.icon}</span>
                    <div className="calcs-card-body">
                        <span className="calcs-card-name">{tool.name}</span>
                        <span className="calcs-card-sub">Utility</span>
                    </div>
                </Link>
            ))}
        </div>
    </div>
);

export default Calculators;
