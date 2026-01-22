import React, { useMemo } from 'react';
import { mockSkills, mockUser } from '../../data/mockData';
import './Dashboard.css';

const SkillCard = ({ skill }) => {
  const isMaxed = skill.xp >= skill.targetXp;
  const xpRemaining = Math.max(0, skill.targetXp - skill.xp);
  
  // Calculate hours remaining; avoid division by zero
  const hoursRemaining = skill.efficientRate > 0 
    ? (xpRemaining / skill.efficientRate).toFixed(2) 
    : 'N/A';

  const progressPercent = Math.min(100, (skill.xp / skill.targetXp) * 100).toFixed(1);

  return (
    <div className={`skill-card ${isMaxed ? 'maxed' : ''}`}>
      <div className="skill-header">
        <span className="skill-name">{skill.name}</span>
        <span className="skill-level">{skill.level} / {skill.maxLevel}</span>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      <div className="skill-details">
        {isMaxed ? (
          <div className="completed-badge">MAXED</div>
        ) : (
          <>
            <div className="detail-item">
              <span className="label">XP Left:</span>
              <span className="value">{xpRemaining.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">Est. Time:</span>
              <span className="value">{hoursRemaining} hrs</span>
            </div>
            <div className="detail-item">
              <span className="label">Rate:</span>
              <span className="value">~{(skill.efficientRate/1000).toFixed(0)}k/hr</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { totalHours, totalSlayerMaxHours, completionPercentage } = useMemo(() => {
    let hours = 0;
    let totalTargetXp = 0;
    let currentTotalXp = 0;

    mockSkills.forEach(skill => {
        const remaining = Math.max(0, skill.targetXp - skill.xp);
        if (skill.efficientRate > 0) {
            hours += remaining / skill.efficientRate;
        }
        totalTargetXp += skill.targetXp;
        currentTotalXp += Math.min(skill.xp, skill.targetXp); // Cap at target for percentage
    });

    return {
        totalHours: hours.toFixed(1),
        completionPercentage: ((currentTotalXp / totalTargetXp) * 100).toFixed(1)
    };
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-info">
          <h2>Welcome, {mockUser.username}</h2>
          <span className="user-rank">Rank: {mockUser.rank.toLocaleString()}</span>
        </div>
        
        <div className="global-stats">
          <div className="stat-box">
            <h3>Time to Max</h3>
            <p className="highlight">{totalHours} Hours</p>
          </div>
          <div className="stat-box">
            <h3>Total Level</h3>
            <p>{mockUser.totalLevel}</p>
          </div>
           <div className="stat-box">
            <h3>Completion</h3>
            <p>{completionPercentage}%</p>
          </div>
        </div>
      </div>

      <div className="skills-grid">
        {mockSkills.map(skill => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
