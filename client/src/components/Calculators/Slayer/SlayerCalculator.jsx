import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { SLAYER_MASTERS, SLAYER_MONSTERS } from '../../../data/slayerData';
import { getXpAtLevel } from '../../../utils/rs3';
import './SlayerCalculator.css';

const SlayerCalculator = () => {
    const { characterData } = useCharacter();
    
    // State
    const [currentLevel, setCurrentLevel] = useState(1);
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(120);
    const [targetXp, setTargetXp] = useState(getXpAtLevel(120));
    
    // Mode Selection: 'master' or 'monster'
    const [calcMode, setCalcMode] = useState('master');
    
    // Selections
    const [selectedMaster, setSelectedMaster] = useState(SLAYER_MASTERS[0]);
    const [selectedMonster, setSelectedMonster] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    // User Overrides
    const [customTaskXp, setCustomTaskXp] = useState(SLAYER_MASTERS[0].avgXp);

    // Initialize from character data
    useEffect(() => {
        if (characterData && Array.isArray(characterData)) {
            const skill = characterData.find(s => s.name === "Slayer");
            if (skill) {
                setCurrentLevel(skill.level);
                setCurrentXp(skill.xp);
                if (skill.level >= 99 && targetLevel === 99) {
                     setTargetLevel(120);
                     setTargetXp(getXpAtLevel(120));
                }
            }
        }
    }, [characterData]);

    const handleMasterChange = (master) => {
        setSelectedMaster(master);
        setCustomTaskXp(master.avgXp);
    };

    const handleLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setCurrentLevel(Math.min(120, Math.max(1, level)));
        // Note: Not updating XP automatically here to allow disjointed inputs if needed, 
        // but typically you'd sync them. For now, matching other calcs pattern simpler.
        setCurrentXp(getXpAtLevel(level));
    };

    const handleTargetLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setTargetLevel(Math.min(120, Math.max(1, level)));
        setTargetXp(getXpAtLevel(level));
    };

    // Derived
    const remainingXp = Math.max(0, targetXp - currentXp);
    
    const monsterCategories = ['All', ...new Set(SLAYER_MONSTERS.map(m => m.category))];
    const filteredMonsters = SLAYER_MONSTERS.filter(m => 
        selectedCategory === 'All' || m.category === selectedCategory
    ).sort((a,b) => b.xp - a.xp);

    return (
        <div className="slayer-calculator">
            <h2>Slayer Calculator</h2>

            <div className="calc-layout">
                {/* 1. Stats Column */}
                <div className="card input-section">
                    <h3>Current Stats</h3>
                    <div className="input-group">
                        <label>Level</label>
                        <input 
                            type="number" 
                            value={currentLevel} 
                            onChange={handleLevelChange}
                            min="1" max="120"
                        />
                    </div>
                    <div className="input-group">
                        <label>Experience</label>
                        <input 
                            type="number" 
                            value={currentXp} 
                            onChange={(e) => setCurrentXp(parseInt(e.target.value) || 0)}
                            min="0"
                        />
                    </div>

                    <h3>Target</h3>
                    <div className="input-group">
                        <label>Level</label>
                        <input 
                            type="number" 
                            value={targetLevel} 
                            onChange={handleTargetLevelChange}
                            min="1" max="120"
                        />
                    </div>
                    <div className="helper-text">
                        XP needed: {remainingXp.toLocaleString()}
                    </div>
                </div>

                {/* 2. Middle Column - Dual Mode Switching */}
                <div className="card methods-section">
                    <div className="mode-toggle">
                        <button 
                            className={`mode-btn ${calcMode === 'master' ? 'active' : ''}`}
                            onClick={() => setCalcMode('master')}
                        >
                            Task Estimator
                        </button>
                        <button 
                            className={`mode-btn ${calcMode === 'monster' ? 'active' : ''}`}
                            onClick={() => setCalcMode('monster')}
                        >
                            Mob Grinder
                        </button>
                    </div>

                    {calcMode === 'master' ? (
                        <div className="master-list">
                            <h3>Select Slayer Master</h3>
                            <div className="methods-grid">
                                {SLAYER_MASTERS.map(master => (
                                    <div 
                                        key={master.id}
                                        className={`method-btn master-btn ${selectedMaster?.id === master.id ? 'active' : ''}`}
                                        onClick={() => handleMasterChange(master)}
                                    >
                                        <div className="method-name">{master.name}</div>
                                        <div className="method-details">Avg XP: {master.avgXp.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="custom-xp-input">
                                <label>Adjust Average XP/Task:</label>
                                <input 
                                    type="number" 
                                    value={customTaskXp} 
                                    onChange={(e) => setCustomTaskXp(parseInt(e.target.value) || 0)}
                                />
                                <small>This varies heavily on your block/prefer list.</small>
                            </div>
                        </div>
                    ) : (
                        <div className="monster-list">
                            <div className="methods-header">
                                <h3>Select Monster</h3>
                                <select 
                                    className="category-select"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    {monsterCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="methods-grid">
                                {filteredMonsters.map(mob => (
                                    <div 
                                        key={mob.id}
                                        className={`method-btn ${selectedMonster?.id === mob.id ? 'active' : ''}`}
                                        onClick={() => setSelectedMonster(mob)}
                                    >
                                        <div className="method-name">{mob.name}</div>
                                        <div className="method-details">{mob.xp} XP / kill</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Results Column */}
                <div className="card results-section">
                    <h3>Results</h3>
                    
                    {calcMode === 'master' && selectedMaster && (
                        <div className="results-content">
                            <div className="result-main">
                                <div className="action-icon">💀</div>
                                <div className="action-count">
                                    <span className="number">
                                        {Math.ceil(remainingXp / customTaskXp).toLocaleString()}
                                    </span>
                                    <span className="label">Tasks</span>
                                </div>
                            </div>
                            <div className="result-details">
                                <p><span>Master:</span> <strong>{selectedMaster.name}</strong></p>
                                <p><span>XP Per Task:</span> <strong>{customTaskXp.toLocaleString()}</strong></p>
                                <p><span>Est. Points:</span> <strong>{(Math.ceil(remainingXp / customTaskXp) * 20).toLocaleString()}+</strong></p>
                            </div>
                        </div>
                    )}

                    {calcMode === 'monster' && selectedMonster && (
                        <div className="results-content">
                            <div className="result-main">
                                <div className="action-icon">⚔️</div>
                                <div className="action-count">
                                    <span className="number">
                                        {Math.ceil(remainingXp / selectedMonster.xp).toLocaleString()}
                                    </span>
                                    <span className="label">Kills</span>
                                </div>
                            </div>
                            <div className="result-details">
                                <p><span>Target:</span> <strong>{selectedMonster.name}</strong></p>
                                <p><span>XP Per Kill:</span> <strong>{selectedMonster.xp}</strong></p>
                            </div>
                        </div>
                    )}
                    
                    {calcMode === 'monster' && !selectedMonster && (
                        <div className="no-selection"><p>Select a monster</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SlayerCalculator;
