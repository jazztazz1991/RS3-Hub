import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { WOODCUTTING_ITEMS, WOODCUTTING_BOOSTS } from '../../../data/woodcuttingData';
import { getXpAtLevel } from '../../../utils/rs3';
import './WoodcuttingCalculator.css';

const WoodcuttingCalculator = () => {
    const { characterData } = useCharacter();
    const [currentXp, setCurrentXp] = useState(0);
    const [targetXp, setTargetXp] = useState(13034431); // 99 default
    
    // Modifiers
    const [activeBoosts, setActiveBoosts] = useState([]);

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Load character data
    useEffect(() => {
        if (characterData) {
            const skill = characterData.find(s => s.name === "Woodcutting");
            if (skill) {
                setCurrentXp(skill.xp);
                setTargetXp(skill.level < 99 ? 13034431 : 104273167);
            }
        }
    }, [characterData]);

    // Filter Logic
    const filteredMethods = WOODCUTTING_ITEMS.filter(method => {
        const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    }).sort((a,b) => a.level - b.level); // Sort by level ascending

    // XP Calculation
    const getXpPerAction = (baseXp) => {
        let multiplier = 1.0;
        activeBoosts.forEach(boostId => {
            const boost = WOODCUTTING_BOOSTS.find(b => b.id === boostId);
            if (boost) multiplier += boost.multiplier;
        });
        return baseXp * multiplier;
    };

    const remainingXp = Math.max(0, targetXp - currentXp);
    const xpPerAction = selectedMethod ? getXpPerAction(selectedMethod.xp) : 0;
    const actionsNeeded = selectedMethod ? Math.ceil(remainingXp / xpPerAction) : 0;

    const handleMethodSelect = (method) => {
        setSelectedMethod(method);
    };

    const toggleBoost = (boostId) => {
        setActiveBoosts(prev => {
            if (prev.includes(boostId)) return prev.filter(id => id !== boostId);
            return [...prev, boostId];
        });
    };

    return (
        <div className="woodcutting-calculator">
            <h2>Woodcutting Calculator</h2>

            {/* Modifiers */}
            <div className="modifiers">
                {WOODCUTTING_BOOSTS.map(boost => (
                    <label key={boost.id} className="checkbox-container" title={boost.description}>
                        <input 
                            type="checkbox" 
                            checked={activeBoosts.includes(boost.id)} 
                            onChange={() => toggleBoost(boost.id)} 
                        />
                        {boost.name} (+{(boost.multiplier * 100).toFixed(0)}%)
                    </label>
                ))}
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
                        <label>Target XP</label>
                        <input 
                            type="number" 
                            value={targetXp} 
                            onChange={(e) => setTargetXp(Number(e.target.value))} 
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

                {/* Middle Column: List (Methods) - WAS RIGHT, NOW MIDDLE */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <input 
                            type="text" 
                            placeholder="Search trees..." 
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

                {/* Right Column: Results - WAS MIDDLE, NOW RIGHT */}
                <div className="calc-results">
                    <div className="result-main">
                        <div className="action-icon">
                            🪓
                        </div>
                        <div className="action-count">
                            <span className="number">
                                {selectedMethod 
                                    ? actionsNeeded.toLocaleString() 
                                    : '---'}
                            </span>
                            <span className="label">Logs Needed</span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p>
                            <span>Remaining XP:</span>
                            <span>{remainingXp.toLocaleString()}</span>
                        </p>
                        <p>
                            <span>Tree Type:</span>
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

export default WoodcuttingCalculator;
