import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { WOODCUTTING_ITEMS, WOODCUTTING_BOOSTS } from '../../../data/woodcuttingData';
import { XP_TABLE, getLevelAtXp, getXpAtLevel } from '../../../utils/rs3';
import './WoodcuttingCalculator.css';

const WoodcuttingCalculator = () => {
    const { characterData } = useCharacter();
    
    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(XP_TABLE[99]);
    const [selectedItemId, setSelectedItemId] = useState('willow');
    const [activeBoosts, setActiveBoosts] = useState([]);

    // Initialize from Character Context
    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const wcSkill = characterData.find(s => s.name === "Woodcutting");
            if (wcSkill) {
                setCurrentXp(wcSkill.xp);
                // Auto-set next milestone
                const lvl = wcSkill.level;
                if (lvl < 99) setTargetLevel(99);
                else setTargetLevel(120); 
            }
        }
    }, [characterData]);

    // Update Target XP when Level Changes
    useEffect(() => {
        if (targetLevel >= 1 && targetLevel <= 120) {
             setTargetXp(getXpAtLevel(targetLevel));
        }
    }, [targetLevel]);

    const handleBoostToggle = (boostId) => {
        setActiveBoosts(prev => {
            if (prev.includes(boostId)) {
                return prev.filter(id => id !== boostId);
            } else {
                return [...prev, boostId];
            }
        });
    };

    const selectedItem = WOODCUTTING_ITEMS.find(i => i.id === selectedItemId) || WOODCUTTING_ITEMS[0];

    // Calculations
    const calculateResults = () => {
        const remaining = Math.max(0, targetXp - currentXp);
        
        // Base Multiplier is 1.0. Add modifiers.
        let totalMultiplier = 1.0;
        activeBoosts.forEach(boostId => {
            const boost = WOODCUTTING_BOOSTS.find(b => b.id === boostId);
            if (boost) totalMultiplier += boost.multiplier;
        });

        const xpPerAction = selectedItem.xp * totalMultiplier;
        const actionsNeeded = Math.ceil(remaining / xpPerAction);

        return {
            remaining,
            xpPerAction: xpPerAction.toFixed(1),
            actionsNeeded,
            itemName: selectedItem.name,
            totalBonus: ((totalMultiplier - 1) * 100).toFixed(1) + '%'
        };
    };

    const results = calculateResults();

    return (
        <div className="woodcutting-calculator-container">
            <h2>Woodcutting Calculator</h2>
            
            <div className="calculator-layout">
                {/* Inputs Section */}
                <div className="input-section">
                    <div className="input-group">
                        <label>Current XP</label>
                        <input 
                            type="number" 
                            value={currentXp} 
                            onChange={(e) => setCurrentXp(parseInt(e.target.value) || 0)}
                        />
                         <span className="helper-text lvl-helper">Level: {getLevelAtXp(currentXp)}</span>
                    </div>

                    <div className="input-group">
                        <label>Target Level</label>
                        <input 
                            type="number" 
                            value={targetLevel} 
                            onChange={(e) => setTargetLevel(parseInt(e.target.value) || 1)}
                            min="1" max="120"
                        />
                        <span className="helper-text lvl-helper">XP: {targetXp.toLocaleString()}</span>
                    </div>

                     <div className="selection-grids">
                        <div className="grid-column">
                            <h4 className="grid-label">Tree Type</h4>
                            <div className="item-list">
                                {WOODCUTTING_ITEMS.map(item => (
                                    <div 
                                        key={item.id} 
                                        className={`selection-card ${selectedItemId === item.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedItemId(item.id)}
                                    >
                                        <div className="card-header">
                                            <h4>{item.name}</h4>
                                            <span className="level-req">Lvl {item.level}</span>
                                        </div>
                                        <span className="xp-val">{item.xp} XP</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="grid-column">
                             <h4 className="grid-label">Boosts (Stackable)</h4>
                            <div className="method-list">
                                {WOODCUTTING_BOOSTS.map(boost => (
                                    <div 
                                        key={boost.id} 
                                        className={`selection-card ${activeBoosts.includes(boost.id) ? 'selected' : ''}`}
                                        onClick={() => handleBoostToggle(boost.id)}
                                    >
                                        <div className="card-header">
                                            <h4>{boost.name}</h4>
                                        </div>
                                        <span className="xp-val">+{boost.multiplier * 100}%</span>
                                        <div style={{fontSize: '0.8rem', color: '#888'}}>{boost.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                </div>

                {/* Results Section */}
                <div className="results-section">
                    <h3>Projections</h3>
                    <div className="results-grid">
                        <div className="result-card">
                            <h4>XP Remaining</h4>
                            <span className="value">{results.remaining.toLocaleString()}</span>
                        </div>
                        <div className="result-card">
                            <h4>XP per Log</h4>
                            <span className="value">{results.xpPerAction}</span>
                            <span className="sub-value">Bonus: {results.totalBonus}</span>
                        </div>
                        <div className="result-card highlight">
                            <h4>Logs Needed</h4>
                            <span className="value">{results.actionsNeeded.toLocaleString()}</span>
                            <span className="sub-value">{results.itemName}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WoodcuttingCalculator;
