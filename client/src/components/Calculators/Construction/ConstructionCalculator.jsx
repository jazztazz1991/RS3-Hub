import React, { useState, useEffect } from 'react';
import constructionData from '../../../data/constructionData';
import { useCharacter } from '../../../context/CharacterContext';
import { getXpAtLevel, getLevelAtXp } from '../../../utils/rs3';
import './ConstructionCalculator.css';

const ConstructionCalculator = () => {
    const { characterData } = useCharacter();
    const [currentXp, setCurrentXp] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(13034431);
    const [calcMode, setCalcMode] = useState('standard'); // 'standard' | 'contracts'
    
    // Modifiers
    const [useOutfit, setUseOutfit] = useState(false);
    const [useChisel, setUseChisel] = useState(false); // God Chisel +1%
    const [useStick, setUseStick] = useState(false); // Torstol Sticks +2%

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Load character data
    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const consHelper = characterData.find(s => s.name === 'Construction');
            if (consHelper) {
                setCurrentXp(consHelper.xp);
                setCurrentLevel(consHelper.level);
                // Default target
                const nextTarget = consHelper.level < 99 ? 99 : 120;
                setTargetLevel(nextTarget);
                setTargetXp(getXpAtLevel(nextTarget));
            }
        }
    }, [characterData]);

    // Handle XP/Level Changes
    const handleCurrentLevelChange = (e) => {
        const lvl = parseInt(e.target.value) || 1;
        setCurrentLevel(lvl);
        setCurrentXp(getXpAtLevel(lvl));
    };

    const handleCurrentXpChange = (e) => {
        const xp = parseInt(e.target.value) || 0;
        setCurrentXp(xp);
        setCurrentLevel(getLevelAtXp(xp));
    };

    const handleTargetLevelChange = (e) => {
        const lvl = parseInt(e.target.value) || 1;
        setTargetLevel(lvl);
        setTargetXp(getXpAtLevel(lvl));
    };

    const handleTargetXpChange = (e) => {
        const xp = parseInt(e.target.value) || 0;
        setTargetXp(xp);
        setTargetLevel(getLevelAtXp(xp));
    };

    const activeData = constructionData[calcMode] || [];

    // Filter Logic
    const filteredMethods = activeData.filter(method => {
        const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || method.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', ...new Set(activeData.map(m => m.category))];

    // XP Calculation
    const getXpPerAction = (baseXp) => {
        let multiplier = 1;
        if (useOutfit) multiplier += 0.06;
        if (useChisel) multiplier += 0.01;
        if (useStick) multiplier += 0.02;
        return baseXp * multiplier;
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
        <div className="construction-calculator">
            <h2>Construction Calculator</h2>

            {/* Modifiers */}
            <div className="modifiers">
                <label className="checkbox-container" title="Master Constructor Outfit (+6%)">
                    <input 
                        type="checkbox" 
                        checked={useOutfit} 
                        onChange={(e) => setUseOutfit(e.target.checked)} 
                    />
                    Constructor Outfit (+6%)
                </label>
                <label className="checkbox-container" title="God Chisel (+1%)">
                    <input 
                        type="checkbox" 
                        checked={useChisel} 
                        onChange={(e) => setUseChisel(e.target.checked)} 
                    />
                    God Chisel (+1%)
                </label>
                <label className="checkbox-container" title="Torstol Incense Sticks (+2%)">
                    <input 
                        type="checkbox" 
                        checked={useStick} 
                        onChange={(e) => setUseStick(e.target.checked)} 
                    />
                    Torstol Incense (+2%)
                </label>
            </div>

            {/* Mode Toggle */}
            <div className="mode-toggle">
                <button 
                    className={`mode-btn ${calcMode === 'standard' ? 'active' : ''}`}
                    onClick={() => toggleMode('standard')}
                >
                    <span className="emoji">🔨</span> Building
                </button>
                <button 
                    className={`mode-btn ${calcMode === 'contracts' ? 'active' : ''}`}
                    onClick={() => toggleMode('contracts')}
                >
                    <span className="emoji">📜</span> Contracts
                </button>
            </div>

            <div className="calc-layout">
                {/* Left Column: Inputs */}
                <div className="calc-inputs">
                    <div className="input-row-flex">
                        <div className="input-group">
                            <label>Current Level</label>
                            <input 
                                type="number" 
                                value={currentLevel} 
                                onChange={handleCurrentLevelChange} 
                                min="1" max="120"
                            />
                        </div>
                        <div className="input-group">
                            <label>Current XP</label>
                            <input 
                                type="number" 
                                value={currentXp} 
                                onChange={handleCurrentXpChange} 
                            />
                        </div>
                    </div>
                    <div className="input-row-flex">
                        <div className="input-group">
                            <label>Target Level</label>
                            <input 
                                type="number" 
                                value={targetLevel} 
                                onChange={handleTargetLevelChange}
                                min="1" max="120"
                            />
                        </div>
                        <div className="input-group">
                            <label>Target XP</label>
                            <input 
                                type="number" 
                                value={targetXp} 
                                onChange={handleTargetXpChange} 
                            />
                        </div>
                    </div>
                    
                    {selectedMethod && (
                        <div className="selected-method-card">
                            <h3>{selectedMethod.name}</h3>
                            <p className="method-xp">Base XP: {selectedMethod.xp.toLocaleString()}</p>
                            <p className="method-xp-actual">
                                Actual XP: {xpPerAction.toFixed(1)}
                            </p>
                            <p className="method-level">Level: {selectedMethod.level}</p>
                            <p className="method-cat">Type: {selectedMethod.category}</p>
                            {selectedMethod.materials && (
                                <p className="method-mat">Materials: {selectedMethod.materials}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Middle Column: List */}
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
                            {calcMode === 'standard' ? '🪑' : '🏠'}
                        </div>
                        <div className="action-count">
                            <span className="number">
                                {selectedMethod 
                                    ? actionsNeeded.toLocaleString() 
                                    : '---'}
                            </span>
                            <span className="label">
                                {calcMode === 'standard' ? 'Items to Build' : 'Contracts'}
                            </span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p>
                            <span>Current Level:</span>
                            <span>{currentLevel}</span>
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
            </div>
        </div>
    );
};

export default ConstructionCalculator;
