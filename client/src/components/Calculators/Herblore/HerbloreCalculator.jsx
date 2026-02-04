import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { HERBLORE_METHODS } from '../../../data/herbloreData';
import { XP_TABLE, getLevelAtXp, getXpAtLevel } from '../../../utils/rs3';
import './HerbloreCalculator.css';

const HerbloreCalculator = () => {
    const { characterData } = useCharacter();
    
    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(XP_TABLE[99]);
    const [selectedMethodId, setSelectedMethodId] = useState('overload');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Initialize from Character Context
    useEffect(() => {
        if (characterData && characterData.length > 0) {
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
        setTargetLevel(lvl);
    };

    const handleXpChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setCurrentXp(val);
    };

    // Calculation
    const selectedMethod = HERBLORE_METHODS.find(m => m.id === selectedMethodId);
    const xpRemaining = Math.max(0, targetXp - currentXp);
    const itemsNeeded = selectedMethod && selectedMethod.xp > 0 
        ? Math.ceil(xpRemaining / selectedMethod.xp) 
        : 0;

    const currentLevel = getLevelAtXp(currentXp);

    // Filter
    const filteredMethods = HERBLORE_METHODS.filter(m => {
        if (categoryFilter === 'All') return true;
        return m.category === categoryFilter;
    });

    return (
        <div className="herblore-calculator">
            <h2>Herblore Calculator</h2>
            
            <div className="calc-layout">
                {/* Inputs */}
                <div className="calc-inputs card">
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
                </div>

                {/* Methods */}
                <div className="calc-methods card">
                     <div className="methods-header">
                        <h3>Select Method</h3>
                        <select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="category-select"
                        >
                            <option value="All">All Categories</option>
                            <option value="Cleaning">Cleaning Herbs</option>
                            <option value="Standard Potions">Standard Potions</option>
                            <option value="Extremes">Extremes</option>
                            <option value="Overloads">Overloads</option>
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

                {/* Results */}
                <div className="calc-results card">
                    <h3>Results</h3>
                    <div className="result-main">
                        <div className="action-icon">🧪</div>
                        <div className="action-count">
                            <span className="number">{itemsNeeded.toLocaleString()}</span>
                            <span className="label">Potions / Herbs Needed</span>
                        </div>
                    </div>
                    
                    <div className="result-details">
                         <p>Method: <strong>{selectedMethod?.name}</strong></p>
                         <p>XP Per Action: <strong>{selectedMethod?.xp}</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HerbloreCalculator;
