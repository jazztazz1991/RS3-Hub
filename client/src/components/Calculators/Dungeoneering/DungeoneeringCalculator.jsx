import React, { useState, useEffect } from 'react';
import { dungeoneeringData } from '../../../data/dungeoneeringData';
import { useCharacter } from '../../../context/CharacterContext';
import './DungeoneeringCalculator.css';

const DungeoneeringCalculator = () => {
    const { character } = useCharacter();
    const [currentXp, setCurrentXp] = useState(0);
    const [targetXp, setTargetXp] = useState(13034431); // 99 default
    const [calcMode, setCalcMode] = useState('floors'); // 'floors' | 'elite'
    
    // Modifiers
    const [useOutfit, setUseOutfit] = useState(false); // Gorajo +7%
    const [useWildcard, setUseWildcard] = useState(false); // Double XP/Tokens or Cards +100% (2x)
    // Team Cards can be 1.5x, 2x etc. We'll simplify to a 2x "Card Active" toggle for clarity.

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Load character data
    useEffect(() => {
        if (character?.skills?.Dungeoneering) {
            setCurrentXp(character.skills.Dungeoneering.xp);
            // DG goes to 120
            setTargetXp(character.skills.Dungeoneering.level < 120 ? 104273167 : 200000000); 
        }
    }, [character]);

    const activeData = dungeoneeringData[calcMode] || [];

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
        // Additive or Multiplicative? 
        // Cards usually multiply everything at the end. Outfit adds to base.
        // For simplicity: (Base * (1 + Outfit)) * Card
        
        let outfitMult = 1;
        if (useOutfit) outfitMult += 0.07;
        
        xp = xp * outfitMult;

        if (useWildcard) xp = xp * 2; // Simulating a Preening Ibis / Thieving Locust card effect or simple DXP

        return xp;
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
        <div className="dungeoneering-calculator">
            <h2>Dungeoneering Calculator</h2>

            {/* Modifiers */}
            <div className="modifiers">
                <label className="checkbox-container" title="Gorajo/Warped Outfit (+7%)">
                    <input 
                        type="checkbox" 
                        checked={useOutfit} 
                        onChange={(e) => setUseOutfit(e.target.checked)} 
                    />
                    Master Outfit (+7%)
                </label>
                <label className="checkbox-container" title="XP Card / DXP (2x)">
                    <input 
                        type="checkbox" 
                        checked={useWildcard} 
                        onChange={(e) => setUseWildcard(e.target.checked)} 
                    />
                    2x Card / DXP
                </label>
            </div>

            {/* Mode Toggle */}
            <div className="mode-toggle">
                <button 
                    className={`mode-btn ${calcMode === 'floors' ? 'active' : ''}`}
                    onClick={() => toggleMode('floors')}
                >
                    <span className="emoji">🗝️</span> Floors (Daemonheim)
                </button>
                <button 
                    className={`mode-btn ${calcMode === 'elite' ? 'active' : ''}`}
                    onClick={() => toggleMode('elite')}
                >
                    <span className="emoji">🐉</span> Elite Dungeons / Dailies
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
                            <p className="method-xp">Avg XP: {selectedMethod.xp.toLocaleString()}</p>
                            <p className="method-xp-actual">
                                Calc XP: {xpPerAction.toLocaleString()}
                                {(useOutfit || useWildcard) && <span className="highlight">*</span>}
                            </p>
                            <p className="method-cat">Type: {selectedMethod.category}</p>
                            {selectedMethod.floorType && <p className="method-detail">Theme: {selectedMethod.floorType}</p>}
                            {selectedMethod.notes && <p className="method-detail">Note: {selectedMethod.notes}</p>}
                        </div>
                    )}
                </div>

                {/* Middle Column: Results */}
                <div className="calc-results">
                    <div className="result-main">
                        <div className="action-icon">
                            {calcMode === 'floors' ? '🏰' : '⚔️'}
                        </div>
                        <div className="action-count">
                            <span className="number">
                                {selectedMethod 
                                    ? actionsNeeded.toLocaleString() 
                                    : '---'}
                            </span>
                            <span className="label">
                                {calcMode === 'floors' ? 'Floors Needed' : 'Runs Needed'}
                            </span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p>
                            <span>Staying Level:</span>
                            <span>{character?.skills?.Dungeoneering?.level || 1}</span>
                        </p>
                        <p>
                            <span>Remaining XP:</span>
                            <span>{remainingXp.toLocaleString()}</span>
                        </p>
                        <p>
                            <span>Est. XP/h:</span>
                            <span>N/A (Variable)</span>
                        </p>
                    </div>
                </div>

                {/* Right Column: List */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <input 
                            type="text" 
                            placeholder="Search methods..." 
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
                                    <span>{method.category}</span>
                                    <span>{method.xp.toLocaleString()} XP</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DungeoneeringCalculator;
