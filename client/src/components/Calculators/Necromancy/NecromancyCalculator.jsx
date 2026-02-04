import React, { useState, useEffect } from 'react';
import { necromancyData } from '../../../data/necromancyData';
import { useCharacter } from '../../../context/CharacterContext';
import './NecromancyCalculator.css';

const NecromancyCalculator = () => {
    const { character } = useCharacter();
    const [currentXp, setCurrentXp] = useState(0);
    const [targetXp, setTargetXp] = useState(13034431); // 99 default
    const [calcMode, setCalcMode] = useState('rituals'); // 'rituals' | 'combat'
    
    // Modifiers
    const [useOutfit, setUseOutfit] = useState(false); // First Necromancer +6%
    const [useIncense, setUseIncense] = useState(false); // Torstol +2%
    const [useWise, setUseWise] = useState(false); // Wise 4 Perk +4%
    const [doDisturbances, setDoDisturbances] = useState(true); // ~80-100% more XP/hr if active

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Load character data
    useEffect(() => {
        if (character?.skills?.Necromancy) {
            setCurrentXp(character.skills.Necromancy.xp);
            setTargetXp(character.skills.Necromancy.level < 120 ? 104273167 : 200000000); // 120 Skill
        }
    }, [character]);

    const activeData = necromancyData[calcMode] || [];

    // Filter Logic
    const filteredMethods = activeData.filter(method => {
        const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || method.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', ...new Set(activeData.map(m => m.category))];

    // XP Calculation
    const getXpPerAction = (baseXp) => {
        let xp = baseXp;

        // Disturbance Multiplier (Rituals only)
        if (calcMode === 'rituals' && doDisturbances) {
            // Very rough estimate: Doing all disturbances essentially doubles the effective XP per ritual cycle
            // because disturbances offer huge XP drops relative to the ritual completion itself.
            xp = xp * 1.8; 
        }

        let multiplier = 1;
        if (useOutfit) multiplier += 0.06;
        if (useIncense) multiplier += 0.02;
        if (useWise) multiplier += 0.04;
        
        return xp * multiplier;
    };

    const remainingXp = Math.max(0, targetXp - currentXp);
    const xpPerAction = selectedMethod ? getXpPerAction(selectedMethod.xp) : 0;
    const actionsNeeded = selectedMethod ? Math.ceil(remainingXp / xpPerAction) : 0;

    const handleMethodSelect = (method) => {
        setSelectedMethod(method);
    };

    const toggleMode = (mode) => {
        setCalcMode(mode);
        setSelectedMethod(null);
        setCategoryFilter('All');
        setSearchTerm('');
    };

    return (
        <div className="necromancy-calculator">
            <h2>Necromancy Calculator</h2>

            {/* Modifiers */}
            <div className="modifiers">
                <label className="checkbox-container" title="First Necromancer Outfit (+6%)">
                    <input 
                        type="checkbox" 
                        checked={useOutfit} 
                        onChange={(e) => setUseOutfit(e.target.checked)} 
                    />
                    Master Outfit (+6%)
                </label>
                <label className="checkbox-container" title="Torstol Incense (+2%)">
                    <input 
                        type="checkbox" 
                        checked={useIncense} 
                        onChange={(e) => setUseIncense(e.target.checked)} 
                    />
                    Torstol Incense (+2%)
                </label>
                <label className="checkbox-container" title="Wise 4 Perk (+4%)">
                    <input 
                        type="checkbox" 
                        checked={useWise} 
                        onChange={(e) => setUseWise(e.target.checked)} 
                    />
                    Wise 4 Perk (+4%)
                </label>
                <label className="checkbox-container" title="Active Play (~1.8x base)" style={{color: '#b388ff'}}>
                    <input 
                        type="checkbox" 
                        checked={doDisturbances} 
                        onChange={(e) => setDoDisturbances(e.target.checked)} 
                        disabled={calcMode !== 'rituals'}
                    />
                    Do Disturbances?
                </label>
            </div>

            {/* Mode Toggle */}
            <div className="mode-toggle">
                <button 
                    className={`mode-btn ${calcMode === 'rituals' ? 'active' : ''}`}
                    onClick={() => toggleMode('rituals')}
                >
                    <span className="emoji">🕯️</span> Rituals
                </button>
                <button 
                    className={`mode-btn ${calcMode === 'combat' ? 'active' : ''}`}
                    onClick={() => toggleMode('combat')}
                >
                    <span className="emoji">💀</span> Combat
                </button>
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
                            <p className="method-xp">Base XP: {selectedMethod.xp.toLocaleString()}</p>
                            <p className="method-xp-actual">
                                Est. XP: {xpPerAction.toFixed(0)}
                            </p>
                            <p className="method-cat">Type: {selectedMethod.category}</p>
                            {calcMode === 'rituals' && doDisturbances && (
                                <p className="method-detail highlight">Includes Disturbance Estimate</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Middle Column: Results */}
                <div className="calc-results">
                    <div className="result-main">
                        <div className="action-icon">
                            {calcMode === 'rituals' ? '🔮' : '⚔️'}
                        </div>
                        <div className="action-count">
                            <span className="number">
                                {selectedMethod 
                                    ? actionsNeeded.toLocaleString() 
                                    : '---'}
                            </span>
                            <span className="label">
                                {calcMode === 'rituals' ? 'Rituals Needed' : 'Kills Needed'}
                            </span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p>
                            <span>Staying Level:</span>
                            <span>{character?.skills?.Necromancy?.level || 1}</span>
                        </p>
                        <p>
                            <span>Remaining XP:</span>
                            <span>{remainingXp.toLocaleString()}</span>
                        </p>
                        <p>
                            <span>Method Rate:</span>
                            <span>{selectedMethod?.xp} XP</span>
                        </p>
                    </div>
                </div>

                {/* Right Column: List */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
            </div>
        </div>
    );
};

export default NecromancyCalculator;
