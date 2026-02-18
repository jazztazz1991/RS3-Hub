import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { FISHING_ITEMS, FISHING_BOOSTS } from '../../../data/fishingData';
import { getXpAtLevel } from '../../../utils/rs3';
import './FishingCalculator.css';

const FishingCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();

    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(13034431);
    
    // Modifiers
    const [activeBoosts, setActiveBoosts] = useState([]);
    const [filterCategory, setFilterCategory] = useState('All');

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Initialize from Character Context
    useEffect(() => {
        updateReportContext({
            tool: 'Fishing Calculator',
            state: {
                xp: currentXp,
                target: targetLevel,
                method: selectedMethod?.name,
                cat: filterCategory,
                boosts: activeBoosts
            }
        });
        return () => clearReportContext();
    }, [currentXp, targetLevel, selectedMethod, filterCategory, activeBoosts]);

    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const skill = characterData.find(s => s.name === "Fishing");
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
    const categories = ['All', ...new Set(FISHING_ITEMS.map(i => i.category))];
    const filteredMethods = FISHING_ITEMS.filter(method => {
        const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || method.category === filterCategory;
        return matchesSearch && matchesCategory;
    }).sort((a,b) => a.level - b.level); 

    // XP Calculation
    const getXpPerAction = (baseXp) => {
        let multiplier = 1.0;
        activeBoosts.forEach(boostId => {
            const boost = FISHING_BOOSTS.find(b => b.id === boostId);
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
        <div className="fishing-calculator">
            <h2>Fishing Calculator</h2>

            {/* Modifiers */}
            <div className="modifiers">
                {FISHING_BOOSTS.map(boost => (
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
                            placeholder="Search fish..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         <select 
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
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
                            🎣
                        </div>
                        <div className="action-count">
                            <span className="number">
                                {selectedMethod 
                                    ? actionsNeeded.toLocaleString() 
                                    : '---'}
                            </span>
                            <span className="label">Catches Needed</span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p>
                            <span>Remaining XP:</span>
                            <span>{remainingXp.toLocaleString()}</span>
                        </p>
                        <p>
                            <span>Fish Type:</span>
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

export default FishingCalculator;
