import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { MINING_ROCKS } from '../../../data/miningData';
import { getXpAtLevel } from '../../../utils/rs3';
import './MiningCalculator.css';

const MiningCalculator = () => {
    const { characterData } = useCharacter();

    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(13034431);
    
    // Modifiers (Simplifying for layout consistency first, can add pickaxe/outfits later)
    // const [activeBoosts, setActiveBoosts] = useState([]); 

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Initialize from Character Context
    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const skill = characterData.find(s => s.name === "Mining");
            if (skill) {
                setCurrentXp(skill.xp);
                setTargetLevel(skill.level < 99 ? 99 : 120);
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

    // Filter Logic
    const filteredMethods = MINING_ROCKS.filter(method => {
        const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    }).sort((a,b) => a.level - b.level); 

    // XP Calculation
    const getXpPerAction = (baseXp) => {
        let multiplier = 1.0;
        // Boosts would go here
        return baseXp * multiplier;
    };

    const remainingXp = Math.max(0, targetXp - currentXp);
    const xpPerAction = selectedMethod ? getXpPerAction(selectedMethod.xp) : 0;
    const actionsNeeded = selectedMethod ? Math.ceil(remainingXp / xpPerAction) : 0;

    const handleMethodSelect = (method) => {
        setSelectedMethod(method);
    };

    return (
        <div className="mining-calculator">
            <h2>Mining Calculator</h2>

            {/* Modifiers placeholder */}
            <div className="modifiers">
               <span style={{color: '#90a4ae', fontSize: '0.9rem'}}>Boosts coming soon...</span>
            </div>

            <div className="calc-layout">
                {/* Left Column: Inputs */}
                <div className="calc-inputs">
                    <div className="input-group">
                        <label>Current XP</label>
                        <input 
                            type="number" 
                            value={currentXp} 
                            onChange={(e) => setCurrentXp(Number(e.target.value))} 
                        />
                    </div>
                    <div className="input-group">
                        <label>Target Level</label>
                        <input 
                            type="number" 
                            value={targetLevel} 
                            onChange={handleLevelChange} 
                        />
                    </div>
                     <div className="input-group">
                        <label>Target XP</label>
                        <input 
                            type="number" 
                            value={targetXp} 
                            readOnly
                            style={{opacity: 0.7}}
                        />
                    </div>
                    
                    {selectedMethod && (
                        <div className="selected-method-card">
                            <h3>{selectedMethod.name}</h3>
                            <p className="method-xp">Base XP: {selectedMethod.xp}</p>
                            <p className="method-xp-actual">
                                Est. XP: {xpPerAction.toFixed(1)}
                            </p>
                            <p className="method-level">Level Req: {selectedMethod.level}</p>
                        </div>
                    )}
                </div>

                {/* Middle Column: List (Methods) */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <input 
                            type="text" 
                            placeholder="Search rocks..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="methods-grid">
                        {filteredMethods.map(method => (
                            <button
                                key={method.id}
                                className={`method-btn ${selectedMethod?.id === method.id ? 'active' : ''}`}
                                onClick={() => handleMethodSelect(method)}
                            >
                                <div className="method-name">{method.name}</div>
                                <div className="method-details">
                                    <span>Lvl {method.level}</span>
                                    <span>{method.xp} XP</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="calc-results">
                    <div className="result-main">
                        <div className="action-icon">
                            ⛏️
                        </div>
                        <div className="action-count">
                            <span className="number">
                                {selectedMethod 
                                    ? actionsNeeded.toLocaleString() 
                                    : '---'}
                            </span>
                            <span className="label">Ores Needed</span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p>
                            <span>Remaining XP:</span>
                            <span>{remainingXp.toLocaleString()}</span>
                        </p>
                        <p>
                            <span>Rock Type:</span>
                            <span>{selectedMethod?.name || '-'}</span>
                        </p>
                        <p>
                            <span>Base XP:</span>
                            <span>{selectedMethod?.xp || 0}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiningCalculator;
