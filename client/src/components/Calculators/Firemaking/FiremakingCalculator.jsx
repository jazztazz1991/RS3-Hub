import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { FIREMAKING_ITEMS, FIREMAKING_BOOSTS } from '../../../data/skills/firemakingData';
import { getXpAtLevel } from '../../../utils/rs3';
import './FiremakingCalculator.css';

const FiremakingCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();
    const location = useLocation();

    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(13034431);
    
    // Modifiers
    const [activeBoosts, setActiveBoosts] = useState([]);
    const [usingBonfire, setUsingBonfire] = useState(false);

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Handle Guide Selection
    useEffect(() => {
        if (location.state) {
            const { preSelectMethod, preSelectTarget } = location.state;
            if (preSelectMethod) {
                // Approximate match
                const match = FIREMAKING_ITEMS.find(item => 
                    item.name.toLowerCase().includes(preSelectMethod.toLowerCase()) || 
                    preSelectMethod.toLowerCase().includes(item.name.toLowerCase())
                );
                if (match) {
                    setSelectedMethod(match);
                    setSearchTerm(match.name);
                }
            }
            if (preSelectTarget) {
                setTargetLevel(Math.min(preSelectTarget, 120));
            }
        }
    }, [location.state]);

    // 
    // Initialize from Character Context
    useEffect(() => {
        updateReportContext({
            tool: 'Firemaking Calculator',
            state: {
                xp: currentXp,
                target: targetLevel,
                method: selectedMethod?.name,
                bonfire: usingBonfire,
                boosts: activeBoosts
            }
        });
        return () => clearReportContext();
    }, [currentXp, targetLevel, selectedMethod, usingBonfire, activeBoosts]);

    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const skill = characterData.find(s => s.name === "Firemaking");
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
    const filteredMethods = FIREMAKING_ITEMS.filter(method => {
        const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    }).sort((a,b) => a.level - b.level); 

    const getXpPerAction = () => {
        if (!selectedMethod) return 0;
           
        let base = selectedMethod.xp;
        if (usingBonfire && selectedMethod.bonfireXp) {
            base = Number(selectedMethod.bonfireXp);
        } else {
            base = Number(selectedMethod.xp);
        }

        let multiplier = 1.0;
        let bonus = 0;

        activeBoosts.forEach(boostId => {
            const boost = FIREMAKING_BOOSTS.find(b => b.id === boostId);
            if (boost) multiplier += boost.multiplier;
        });

        return (base * multiplier) + bonus;
    };

    const remainingXp = Math.max(0, targetXp - currentXp);
    const xpPerAction = getXpPerAction();
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
        <div className="firemaking-calculator">
            <div className="calculator-header">
                <h2>Firemaking Calculator</h2>
                <Link to="/guides/firemaking" className="guide-link-btn">View Training Guide</Link>
            </div>

            <div className="calculator-content">
            {/* Modifiers */}
            <div className="modifiers">
                <label className="checkbox-container">
                    <input 
                        type="checkbox" 
                        checked={usingBonfire} 
                        onChange={() => setUsingBonfire(!usingBonfire)} 
                    />
                    Bonfire Mode (Use Bonfire XP)
                </label>
                {FIREMAKING_BOOSTS.filter(b => b.id !== 'bonfire').map(boost => (
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

                {/* Middle Column: List (Methods) - WAS RIGHT, NOW MIDDLE */}
                <div className="calc-methods">
                   <div className="methods-header">
                        <input 
                            type="text" 
                            placeholder="Search logs..." 
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
                            🔥
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
                            <span>Log Type:</span>
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
        </div>
    );
};

export default FiremakingCalculator;
