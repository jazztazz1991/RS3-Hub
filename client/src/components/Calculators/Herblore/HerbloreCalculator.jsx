import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { HERBLORE_ITEMS as HERBLORE_METHODS } from '../../../data/skills/herbloreData';
import { XP_TABLE, getLevelAtXp, getXpAtLevel } from '../../../utils/rs3';
import './HerbloreCalculator.css';

const HerbloreCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();
    
    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(XP_TABLE[99]);
    const [selectedMethodId, setSelectedMethodId] = useState(HERBLORE_METHODS[0]?.id || 'attack_pot'); 
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Initialize from Character Context
    useEffect(() => {
        updateReportContext({
            tool: 'Herblore Calculator',
            state: {
                xp: currentXp,
                target: targetLevel,
                method: selectedMethodId,
                cat: categoryFilter
            }
        });
        return () => clearReportContext();
    }, [currentXp, targetLevel, selectedMethodId, categoryFilter]);

    useEffect(() => {
        if (characterData) {
            const skill = characterData.find(s => s.name === "Herblore");
            if (skill) {
                setCurrentXp(skill.xp);
                if (skill.level < 99) setTargetLevel(99);
                else setTargetLevel(120);
            }
        }
    }, [characterData]);

    // Update Target XP when Target Level changes
    useEffect(() => {
        setTargetXp(getXpAtLevel(targetLevel));
    }, [targetLevel]);

    const handleLevelChange = (e) => {
        const lvl = parseInt(e.target.value) || 1;
        setTargetLevel(Math.min(120, Math.max(1, lvl)));
    };

    const handleXpChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setCurrentXp(Math.max(0, val));
    };

    // Calculation
    const selectedMethod = HERBLORE_METHODS.find(m => m.id === selectedMethodId) || HERBLORE_METHODS[0];
    const xpRemaining = Math.max(0, targetXp - currentXp);
    const itemsNeeded = selectedMethod && selectedMethod.xp > 0 
        ? Math.ceil(xpRemaining / selectedMethod.xp) 
        : 0;

    const currentLevel = getLevelAtXp(currentXp);

    // Filter
    const categories = ['All', ...new Set(HERBLORE_METHODS.map(m => m.category || 'Other'))];
    const filteredMethods = categoryFilter === 'All'
        ? HERBLORE_METHODS
        : HERBLORE_METHODS.filter(m => (m.category || 'Other') === categoryFilter);

    return (
        <div className="herblore-calculator">
            <h2>Herblore Calculator</h2>
            
            <div className="calc-layout">
                {/* 1. Inputs */}
                <div className="calc-inputs">
                    <h3>Current Status</h3>
                    <div className="input-group">
                        <label>Current XP</label>
                        <input 
                            type="number" 
                            value={currentXp} 
                            onChange={handleXpChange} 
                        />
                        <span className="helper-text">Level: {currentLevel}</span>
                    </div>

                    <div className="input-group">
                        <label>Target Level</label>
                        <input 
                            type="number" 
                            value={targetLevel} 
                            onChange={handleLevelChange}
                            max={120}
                        />
                        <span className="helper-text">Target XP: {targetXp.toLocaleString()}</span>
                    </div>

                     {selectedMethod && (
                        <div className="selected-method-card">
                            <h3>{selectedMethod.name}</h3>
                            <p style={{color: '#a5d6a7'}}>Lvl {selectedMethod.level}</p>
                            <p className="method-xp-actual">{selectedMethod.xp} XP</p>
                        </div>
                    )}
                </div>

                {/* 2. Methods (Was 3) */}
                <div className="calc-methods">
                     <div className="methods-header">
                        <h3>Select Method</h3>
                        <select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="category-select"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="methods-grid">
                        {filteredMethods.map(method => (
                            <button
                                key={method.id}
                                className={`method-btn ${selectedMethodId === method.id ? 'active' : ''} ${currentLevel < method.level ? 'locked' : ''}`}
                                onClick={() => setSelectedMethodId(method.id)}
                            >
                                <div className="method-name">{method.name}</div>
                                <div className="method-details">
                                    <span className="level-req">Lvl {method.level}</span>
                                    <span className="xp-val">{method.xp} XP</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Results (Was 2) */}
                <div className="calc-results">
                    <h3>Results</h3>
                    <div className="result-main">
                        <div className="action-icon">🧪</div>
                        <div className="action-count">
                            <span className="number">{itemsNeeded.toLocaleString()}</span>
                            <span className="label"> actions</span>
                        </div>
                    </div>
                    
                    <div className="result-details">
                         <p>
                            <span>Method:</span>
                            <strong>{selectedMethod?.name}</strong>
                         </p>
                         <p>
                            <span>Remaining XP:</span>
                            <strong>{xpRemaining.toLocaleString()}</strong>
                         </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HerbloreCalculator;
