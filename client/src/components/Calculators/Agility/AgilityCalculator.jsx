import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { AGILITY_METHODS } from '../../../data/agilityData';
import { getLevelAtXp, getXpAtLevel } from '../../../utils/rs3';
import './AgilityCalculator.css';

const AgilityCalculator = () => {
    const { characterData } = useCharacter();

    // State
    const [currentLevel, setCurrentLevel] = useState(1);
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(getXpAtLevel(99));
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedMethod, setSelectedMethod] = useState(null);

    // Initialize from character data
    useEffect(() => {
        if (characterData && Array.isArray(characterData)) {
            const skill = characterData.find(s => s.name === "Agility");
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

    const categories = ['All', ...new Set(AGILITY_METHODS.map(m => m.category))];

    const filteredMethods = AGILITY_METHODS.filter(method => {
        const categoryMatch = selectedCategory === 'All' || method.category === selectedCategory;
        return categoryMatch;
    }).sort((a, b) => a.level - b.level);

    return (
        <div className="agility-calculator">
            <h2>Agility Calculator</h2>

            <div className="calc-layout">
                {/* Left Column: Stats Input */}
                <div className="calc-inputs">
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

                    <div className="input-group">
                        <label>Target Level</label>
                        <input
                            type="number"
                            value={targetLevel}
                            onChange={handleTargetLevelChange}
                            min="1" max="120"
                        />
                    </div>

                    {selectedMethod && (
                    <div className="selected-method-card" style={{marginTop: '2rem', padding: '1.5rem', backgroundColor: '#1a252f', borderRadius: '8px', border: '1px solid #34495e'}}>
                        <h3>{selectedMethod.name}</h3>
                        <p style={{color: '#3498db', fontWeight: 'bold'}}>{selectedMethod.xp} XP</p>
                        <p>Lvl {selectedMethod.level}</p>
                    </div>
                    )}
                </div>

                {/* Middle Column: Methods Selection */}
                <div className="calc-methods">
                    <div className="methods-header" style={{marginBottom: '1rem'}}>
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

                    <div className="methods-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', maxHeight: '600px', overflowY: 'auto'}}>
                        {filteredMethods.map(method => (
                            <button
                                key={method.id}
                                className={`method-btn ${selectedMethod?.id === method.id ? 'active' : ''} ${method.level > currentLevel ? 'locked' : ''}`}                                                                                                                     
                                onClick={() => setSelectedMethod(method)}
                                style={{
                                    width: '100%',
                                    backgroundColor: selectedMethod?.id === method.id ? '#2980b9' : '#1a252f',
                                    border: '1px solid #34495e',
                                    padding: '0.8rem',
                                    borderRadius: '6px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    color: 'white'
                                }}
                            >
                                <div className="method-name" style={{fontWeight: 'bold', marginBottom: '0.3rem'}}>{method.name}</div>
                                <div className="method-details" style={{fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between'}}>
                                    <span>Lvl {method.level}</span>
                                    <span>{method.xp} XP</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="calc-results">
                     <div className="result-main" style={{textAlign: 'center', marginBottom: '2rem'}}>
                        <div className="action-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>
                            {selectedMethod?.category === 'Passive' ? '🪶' : '🏃'}
                        </div>
                        <div className="action-count">
                            <span className="number" style={{display: 'block', fontSize: '2.5rem', fontWeight: 'bold', color: '#3498db'}}>
                                {selectedMethod 
                                    ? Math.ceil(remainingXp / selectedMethod.xp).toLocaleString()
                                    : '---'
                                }
                            </span>
                            <span className="label" style={{color: '#bdc3c7'}}>
                                {selectedMethod?.category === 'Passive' ? 'Feathers' :
                                 selectedMethod?.category === 'Shortcut' ? 'Uses' :
                                 selectedMethod?.category === 'Activity' ? 'Actions' : 'Laps'}
                            </span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #34495e', paddingBottom: '0.5rem', marginBottom: '0.5rem'}}>
                            <span>Selected:</span>
                            <strong>{selectedMethod?.name || '-'}</strong>
                        </p>
                        <p style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #34495e', paddingBottom: '0.5rem', marginBottom: '0.5rem'}}>
                            <span>XP Remaining:</span>
                            <strong>{remainingXp.toLocaleString()}</strong>      
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgilityCalculator;
