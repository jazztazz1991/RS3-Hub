import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import { getTargetXp, XP_TABLE } from '../../utils/rs3';
import './Dashboard.css';

const SkillCard = ({ skill }) => {
  if (!skill) return null;
  
  // Calculate Targets
  const trueMaxLevel = XP_TABLE.MAX_LEVELS[skill.name] || 99;
  const trueMaxXp = trueMaxLevel === 110 ? XP_TABLE[110] : (trueMaxLevel === 120 ? XP_TABLE[120] : XP_TABLE[99]);
  
  // Status Checks
  const isTrueMaxed = skill.xp >= trueMaxXp;          // Reached actual cap (99, 110, or 120)
  const isAtLeast99 = skill.xp >= XP_TABLE[99];       // Reached 99
  
  // Current Working Target (for progress bar & header)
  // If we are < 99, target is 99 (XP_TABLE[99])
  // If we are >= 99, target is trueMaxXp
  const currentTargetXp = isAtLeast99 ? trueMaxXp : XP_TABLE[99];
  
  const xpRemaining = Math.max(0, currentTargetXp - skill.xp);
  
  let progressPercent = 0;
  if (skill.xp > 0) {
      if (skill.xp >= currentTargetXp) progressPercent = 100;
      else progressPercent = (skill.xp / currentTargetXp) * 100;
  }
  progressPercent = Math.min(100, progressPercent).toFixed(1);

  // Display texts
  let badgeText = null;
  if (isTrueMaxed) {
      badgeText = trueMaxLevel > 99 ? 'COMPLETIONIST' : 'MAXED';
  } else if (isAtLeast99) {
      // 99-119 Range
      badgeText = 'MAXED'; 
  }

  // Header Target: 99 or 110 or 120
  let headerTarget = 99;
  if (currentTargetXp === XP_TABLE[110]) headerTarget = 110;
  if (currentTargetXp === XP_TABLE[120]) headerTarget = 120;


  return (
    <div className={`skill-card ${isAtLeast99 ? 'maxed' : ''}`}>
      <div className="skill-header">
        <span className="skill-name">{skill.name}</span>
        <span className="skill-level">{skill.level} / {skill.name === 'Overall' ? '???' : headerTarget}</span>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      <div className="skill-details">
        <div className="detail-item">
          <span className="label">XP:</span>
          <span className="value">{skill.xp.toLocaleString()}</span>
        </div>
        <div className="detail-item">
          <span className="label">Rank:</span>
          <span className="value">{skill.rank === -1 ? 'Unranked' : skill.rank.toLocaleString()}</span>
        </div>
        
        {/* Badge / To Go Logic */}
        {isTrueMaxed ? (
          <div className="completed-badge">{badgeText}</div>
        ) : (
          <>
            {/* If Maxed (99) but chasing Comp (110/120), show mini badge or indicator? */}
            {isAtLeast99 && <div className="completed-badge" style={{padding: '0.2rem', marginBottom: '0.3rem', fontSize: '0.8rem'}}>MAXED</div>}
            
            <div className="detail-item">
                <span className="label">{isAtLeast99 ? 'To Comp:' : 'To Go:'}</span>
                <span className="value">{xpRemaining.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    characters, 
    selectedCharId, 
    setSelectedCharId, 
    selectedCharacter,
    characterData, 
    loadingChars, 
    loadingData,
    addCharacter,
    deleteCharacter 
  } = useCharacter();

  
  // Add Char State
  const [newCharName, setNewCharName] = useState('');
  const [addError, setAddError] = useState('');

  const handleAddCharacter = async (e) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    
    setAddError('');
    const result = await addCharacter(newCharName);
    if (result.success) {
      setNewCharName('');
    } else {
      setAddError(result.error);
    }
  };

  const handleDeleteCharacter = async (id, e) => {
    e.stopPropagation(); // Prevent selection when deleting
    if (!window.confirm('Are you sure you want to delete this character?')) return;
    await deleteCharacter(id);
  };

  const selectedCharName = selectedCharacter?.name;

  // Calculate Global Stats
  const globalStats = useMemo(() => {
    if (!characterData.length) return null;
    
    // Overall is usually first, but lets look for it or calc sum
    const overall = characterData.find(s => s.name === 'Overall');
    const totalLevel = overall ? overall.level : 0;
    const totalXp = overall ? overall.xp : 0;

    // Count Maxed (Using getTargetXp logic)
    // Filter out Overall from maxed count
    const skillsList = characterData.filter(s => s.name !== 'Overall');
    const maxedCount = skillsList.filter(s => {
        const target = getTargetXp(s.name, s.xp);
        return s.xp >= target;
    }).length;

    return { totalLevel, totalXp, maxedCount, totalSkills: skillsList.length };

  }, [characterData]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
         <div className="user-info">
             <h2>Welcome, {user.username}</h2>
            {selectedCharName && <span className="user-rank">Viewing: {selectedCharName}</span>}
         </div>

         {/* Global Stats Box */}
         {globalStats && (
            <div className="global-stats">
                <div className="stat-box">
                    <h3>Total Level</h3>
                    <p>{globalStats.totalLevel.toLocaleString()}</p>
                </div>
                <div className="stat-box">
                    <h3>Total XP</h3>
                    <p>{(globalStats.totalXp / 1000000).toFixed(1)}M</p>
                </div>
                <div className="stat-box">
                    <h3>Maxed Skills</h3>
                    <p>{globalStats.maxedCount} / {globalStats.totalSkills}</p>
                </div>
            </div>
         )}
      </header>
       
       {/* Character Controls Section */}
       <div className="controls-section" style={{marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#333', padding: '1rem', borderRadius: '8px'}}> 
            <div className="character-selector">
                {characters.map(char => (
                    <button 
                        key={char.id} 
                        className={`char-btn ${selectedCharId === char.id ? 'active' : ''}`}
                        onClick={() => setSelectedCharId(char.id)}
                    >
                        {char.name}
                         <span 
                            className="delete-char-icon" 
                            onClick={(e) => handleDeleteCharacter(char.id, e)}
                            title="Remove Character"
                        >
                            ✕
                        </span>
                    </button>
                ))}
            </div>

             <div className="add-char-wrapper">
                <form onSubmit={handleAddCharacter} className="add-char-form">
                    <input 
                        type="text" 
                        placeholder="Add RSN" 
                        value={newCharName}
                        onChange={(e) => setNewCharName(e.target.value)}
                        className="add-char-input"
                    />
                    <button type="submit" className="add-char-btn">Add</button>
                </form>
                {addError && <span className="error-message" style={{position: 'absolute', fontSize: '0.8rem', marginTop: '5px'}}>{addError}</span>}
             </div>
       </div>

    
        {loadingChars ? (
             <div className="loading-container">Loading Characters...</div>
        ) : characters.length === 0 ? (
            <div className="no-char-prompt">
                <h3>No Characters Found</h3>
                <p>Add your RuneScape 3 character name above to view stats.</p>
            </div>
        ) : (
            <>
                {loadingData ? (
                    <div className="loading-container">Fetching Hiscores from Jagex...</div>
                ) : (
                    <div className="skills-grid"> 
                        {characterData.length > 0 ? (
                            characterData.slice(1).map(skill => ( // Skip Overall if desired, or map all
                                <SkillCard key={skill.id} skill={skill} />
                            ))
                        ) : (
                            <div className="error-message">Could not load stats for this character. They may not be on the HiScores.</div>
                        )}
                    </div>
                )}
            </>
        )}
    </div>
  );
};

export default Dashboard;
