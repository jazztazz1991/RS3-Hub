import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { THIEVING_METHODS } from '../../../data/thievingData';
import { XP_TABLE, getLevelAtXp, getXpAtLevel } from '../../../utils/rs3';
import './ThievingCalculator.css';

const ThievingCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();
    
    // State
    const [currentLevel, setCurrentLevel] = useState(1);
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(getXpAtLevel(99));
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedMethod, setSelectedMethod] = useState(null);

    // Initialize from character data
    useEffect(() => {
        updateReportContext({
            tool: 'Thieving Calculator',
            state: {
                level: currentLevel,
                target: targetLevel,
                category: selectedCategory,
                method: selectedMethod?.name
            }
        });
        return () => clearReportContext();
    }, [currentLevel, targetLevel, selectedCategory, selectedMethod]);

    useEffect(() => {
        if (characterData && Array.isArray(characterData)) {
            const skill = characterData.find(s => s.name === "Thieving");
            if (skill) {
                setCurrentLevel(skill.level);
                setCurrentXp(skill.xp);
            }
        }
    }, [characterData]);

    // Handlers
    const handleLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setCurrentLevel(Math.min(120, Math.max(1, level)));
        setCurrentXp(getXpAtLevel(level));
    };

    const handleXpChange = (e) => {
        const xp = parseInt(e.target.value) || 0;
        setCurrentXp(Math.max(0, xp));
        setCurrentLevel(getLevelAtXp(xp));
    };

    const handleTargetLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setTargetLevel(Math.min(120, Math.max(1, level)));
        setTargetXp(getXpAtLevel(level));
    };

    // Calculations
    const remainingXp = Math.max(0, targetXp - currentXp);
    
    const categories = ['All', ...new Set(THIEVING_METHODS.map(m => m.category))];

    const filteredMethods = THIEVING_METHODS.filter(method => {
        const categoryMatch = selectedCategory === 'All' || method.category === selectedCategory;
        return categoryMatch;
    }).sort((a, b) => a.level - b.level);

    return (
        <div className="thieving-calculator">
            <h2>Thieving Calculator</h2>

            <div className="calc-layout">
                {/* Left Column: Stats Input */}
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
                            onChange={handleXpChange}
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

                {/* Middle Column: Methods Selection */}
                <div className="card methods-section">
                    <div className="methods-header">
                        <h3>Training Methods</h3>
                        <select 
                            className="category-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="methods-grid">
                        {filteredMethods.map(method => (
                            <div 
                                key={method.id}
                                className={`method-btn ${selectedMethod?.id === method.id ? 'active' : ''} ${method.level > currentLevel ? 'locked' : ''}`}
                                onClick={() => setSelectedMethod(method)}
                            >
                                <div className="method-name">{method.name}</div>
                                <div className="method-details">
                                    <span>Lvl {method.level}</span>
                                    <span>{method.xp} XP</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="card results-section">
                    <h3>Results</h3>
                    {selectedMethod ? (
                        <div className="results-content">
                            <div className="result-main">
                                <div className="action-icon">
                                    {selectedMethod.category === 'Safecracking' ? '🔒' : 
                                     selectedMethod.category === 'Plunder' ? '🏺' : '💰'}
                                </div>
                                <div className="action-count">
                                    <span className="number">
                                        {Math.ceil(remainingXp / selectedMethod.xp).toLocaleString()}
                                    </span>
                                    <span className="label">
                                        {selectedMethod.category === 'Safecracking' ? 'Safes' : 
                                         selectedMethod.category === 'Plunder' ? 'Urns' : 
                                         selectedMethod.category === 'Stall' ? 'Steals' : 'Pickpockets'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="result-details">
                                <p>
                                    <span>Method:</span>
                                    <strong>{selectedMethod.name}</strong>
                                </p>
                                <p>
                                    <span>XP per Action:</span>
                                    <strong>{selectedMethod.xp}</strong>
                                </p>
                                <p>
                                    <span>To Level {targetLevel}:</span>
                                    <strong>{Math.ceil(remainingXp / selectedMethod.xp).toLocaleString()}</strong>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="no-selection">
                            <p>Select a method to see results</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThievingCalculator;
