import React, { useState, useEffect, useMemo } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { SLAYER_MASTERS, SLAYER_MONSTERS } from '../../../data/slayerData';
import { getXpAtLevel } from '../../../utils/rs3';
import { useSlayerLog } from '../../../hooks/useSlayerLog';
import SlayerLog from './SlayerLog';
import './SlayerCalculator.css';

const SlayerCalculator = () => {
    const { characterData, selectedCharacter, updateBlockList } = useCharacter();
    const { getStatsForMonster } = useSlayerLog();
    
    // View Mode: 'calculator' or 'log'
    const [viewMode, setViewMode] = useState('calculator');

    // Stats State
    const [currentLevel, setCurrentLevel] = useState(1);
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(120);
    const [targetXp, setTargetXp] = useState(getXpAtLevel(120));
    
    // Calc Mode Selection: 'master' or 'monster'
    const [calcMode, setCalcMode] = useState('master');
    const [blockedTasks, setBlockedTasks] = useState([]);
    const [taskSearchQuery, setTaskSearchQuery] = useState('');
    const [showBlockList, setShowBlockList] = useState(false);
    
    // Selections
    const [selectedMaster, setSelectedMaster] = useState(SLAYER_MASTERS[0]);
    const [selectedMonster, setSelectedMonster] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    // User Overrides
    const [customTaskXp, setCustomTaskXp] = useState(SLAYER_MASTERS[0].avgXp);

    // Calculate Average XP based on Block List
    const effectiveAvgXp = useMemo(() => {
        if (!selectedMaster || !selectedMaster.tasks) return selectedMaster.avgXp;

        let totalWeight = 0;
        let weightedXpSum = 0;

        selectedMaster.tasks.forEach(task => {
            if (blockedTasks.includes(task.id)) return;

            const monster = SLAYER_MONSTERS.find(m => m.id === task.id);
            // If monster not found, fallback to 0 or average?
            // Assuming we have most, but let's use master.avgXp / 100 as a tiny fallback to avoid 0
            const monsterXp = monster ? monster.xp : (task.xp || 500); 
            
            const avgKillCount = (task.min + task.max) / 2;
            const taskXp = monsterXp * avgKillCount;

            weightedXpSum += taskXp * task.weight;
            totalWeight += task.weight;
        });

        return totalWeight > 0 ? Math.round(weightedXpSum / totalWeight) : 0;
    }, [selectedMaster, blockedTasks]);

    // Update custom XP when calculated changes
    useEffect(() => {
        setCustomTaskXp(effectiveAvgXp);
    }, [effectiveAvgXp]);

    const handleMasterChange = (master) => {
        setSelectedMaster(master);
        // blockedTasks are global for now, or per master? usually global but depends.
        // Let's keep them global for simplicity or reset them? Resetting makes sense as lists differ.
        setBlockedTasks([]); 
    };

    const toggleBlockTask = (taskId) => {
        const newBlockList = blockedTasks.includes(taskId) 
            ? blockedTasks.filter(id => id !== taskId)
            : [...blockedTasks, taskId];

        setBlockedTasks(newBlockList);

        if (selectedCharacter && updateBlockList) {
            updateBlockList(selectedCharacter.id, newBlockList);
        }
    };

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

    // Initialize Block List from DB
    useEffect(() => {
        if (selectedCharacter && selectedCharacter.block_list) {
            try {
                const savedList = JSON.parse(selectedCharacter.block_list);
                if (Array.isArray(savedList)) {
                    setBlockedTasks(savedList);
                }
            } catch (e) {
                console.error("Failed to parse block list", e);
            }
        }
    }, [selectedCharacter]);



    const handleLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setCurrentLevel(Math.min(120, Math.max(1, level)));
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

    // Personal Stats Integration
    let personalStats = null;
    let killsRemaining = 0;
    let estimatedHours = 0;

    if (calcMode === 'monster' && selectedMonster) {
        personalStats = getStatsForMonster(selectedMonster.id);
        killsRemaining = Math.ceil(remainingXp / selectedMonster.xp);
        
        // If we have history, calculate time
        if (personalStats && personalStats.kills > 0 && personalStats.killsPerHour > 0) {
            estimatedHours = killsRemaining / personalStats.killsPerHour;
        }
    }

    return (
        <div className="slayer-calculator">
            
            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${viewMode === 'calculator' ? 'active' : ''}`}
                    onClick={() => setViewMode('calculator')}
                >
                    Calculator
                </button>
                <button 
                    className={`tab-btn ${viewMode === 'log' ? 'active' : ''}`}
                    onClick={() => setViewMode('log')}
                >
                    Slayer Log
                </button>
            </div>

            {viewMode === 'log' ? (
                <SlayerLog />
            ) : (
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
                                    <label>Average XP/Task (Calculated):</label>
                                    <input 
                                        type="number" 
                                        value={customTaskXp} 
                                        onChange={(e) => setCustomTaskXp(parseInt(e.target.value) || 0)}
                                    />
                                    <small>Based on your block list and average kills per task.</small>
                                </div>

                                {selectedMaster && selectedMaster.tasks && (
                                    <div className="block-list-section">
                                        <div className="section-header" onClick={() => setShowBlockList(!showBlockList)}>
                                            <h4>Task Weighting & Block List {showBlockList ? '▼' : '▶'}</h4>
                                        </div>
                                        
                                        {showBlockList && (
                                            <div className="task-list-container">
                                                <div className="task-search-container">
                                                    <input 
                                                        type="text" 
                                                        className="task-search-input"
                                                        placeholder="Search tasks..." 
                                                        value={taskSearchQuery}
                                                        onChange={(e) => setTaskSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                                <div className="task-list-header">
                                                    <span>Block</span>
                                                    <span>Task</span>
                                                    <span>Weight</span>
                                                    <span>XP/Task</span>
                                                </div>
                                                <div className="task-list-scroll">
                                                    {[...selectedMaster.tasks]
                                                        .filter(task => {
                                                            const monster = SLAYER_MONSTERS.find(m => m.id === task.id);
                                                            const taskName = monster ? monster.name : task.id.replace(/_/g, ' ');
                                                            return taskName.toLowerCase().includes(taskSearchQuery.toLowerCase());
                                                        })
                                                        .sort((a,b) => b.weight - a.weight)
                                                        .map((task) => {
                                                        const monster = SLAYER_MONSTERS.find(m => m.id === task.id);
                                                        const taskName = monster ? monster.name : task.id.replace(/_/g, ' ');
                                                        let avgXp = 0;
                                                        if (monster) {
                                                            avgXp = Math.round(monster.xp * ((task.min + task.max)/2));
                                                        }
                                                        const isBlocked = blockedTasks.includes(task.id);
                                                        
                                                        return (
                                                            <div key={task.id} className={`task-row ${isBlocked ? 'blocked' : ''}`}>
                                                                <div className="task-check">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={isBlocked}
                                                                        onChange={() => toggleBlockTask(task.id)}
                                                                    />
                                                                </div>
                                                                <div className="task-name" title={taskName}>{taskName}</div>
                                                                <div className="task-weight">{task.weight}</div>
                                                                <div className="task-xp">{avgXp.toLocaleString()}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                    
                                    {personalStats && personalStats.killsPerHour > 0 && (
                                        <div className="personal-stats-highlight">
                                            <h4>Your Stats</h4>
                                            <p><span>Avg Kills/Hr:</span> <strong>{Math.round(personalStats.killsPerHour)}</strong></p>
                                            <p><span>Est Time:</span> <strong>{estimatedHours.toFixed(1)} hrs</strong></p>
                                        </div>
                                    )}
                                    {(!personalStats || !personalStats.killsPerHour) && (
                                        <div className="personal-stats-empty">
                                            <small>Use the Slayer Log to track kills and get accurate time estimates based on your playstyle.</small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {calcMode === 'monster' && !selectedMonster && (
                            <div className="no-selection"><p>Select a monster</p></div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SlayerCalculator;
