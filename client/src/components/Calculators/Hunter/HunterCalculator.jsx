import React, { useState, useEffect } from 'react';
import { hunterData } from '../../../data/hunterData';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { getXpAtLevel, getLevelAtXp } from '../../../utils/rs3';
import './HunterCalculator.css';

const HunterCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();
    const [currentXp, setCurrentXp] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(13034431);
    const [calcMode, setCalcMode] = useState('standard'); // 'standard' | 'bgh'
    
    // Modifiers
    const [useYaktwee, setUseYaktwee] = useState(false);
    const [useOutfit, setUseOutfit] = useState(false);

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Load character data
    useEffect(() => {
        updateReportContext({
            tool: 'Hunter Calculator',
            state: {
                level: currentLevel,
                target: targetLevel,
                mode: calcMode,
                method: selectedMethod?.name,
                modifiers: { outfit: useOutfit, yaktwee: useYaktwee }
            }
        });
        return () => clearReportContext();
    }, [currentLevel, targetLevel, calcMode, selectedMethod, useOutfit, useYaktwee]);

    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const hunterHelper = characterData.find(s => s.name === 'Hunter');
            if (hunterHelper) {
                setCurrentXp(hunterHelper.xp);
                setCurrentLevel(hunterHelper.level);
                // Default target: Next 99 or 120
                const nextTarget = hunterHelper.level < 99 ? 99 : 120;
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

    const activeData = hunterData[calcMode] || [];

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
        if (useYaktwee) multiplier += 0.05;
        if (useOutfit) multiplier += 0.06;
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
        <div className="hunter-calculator">
            <h2>Hunter Calculator</h2>

            {/* Modifiers */}
            <div className="modifiers">
                <label className="checkbox-container" title="Enhanced Yaktwee Stick (+5%)">
                    <input 
                        type="checkbox" 
                        checked={useYaktwee} 
                        onChange={(e) => setUseYaktwee(e.target.checked)} 
                    />
                    Enhanced Yaktwee Stick (+5%)
                </label>
                <label className="checkbox-container" title="Volcanic Trapper Outfit (+6%)">
                    <input 
                        type="checkbox" 
                        checked={useOutfit} 
                        onChange={(e) => setUseOutfit(e.target.checked)} 
                    />
                    Trapper Outfit (+6%)
                </label>
            </div>

            {/* Mode Toggle */}
            <div className="mode-toggle">
                <button 
                    className={`mode-btn ${calcMode === 'standard' ? 'active' : ''}`}
                    onClick={() => toggleMode('standard')}
                >
                    <span className="emoji">🏹</span> Standard Hunter
                </button>
                <button 
                    className={`mode-btn ${calcMode === 'bgh' ? 'active' : ''}`}
                    onClick={() => toggleMode('bgh')}
                >
                    <span className="emoji">🦖</span> Big Game Hunter
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
                                {(useYaktwee || useOutfit) && <span className="highlight">*</span>}
                            </p>
                            <p className="method-level">Level: {selectedMethod.level}</p>
                            <p className="method-cat">Type: {selectedMethod.category}</p>
                        </div>
                    )}
                </div>

                {/* Middle Column: Methods */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <input 
                            type="text" 
                            placeholder="Search creatures..." 
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
                            {calcMode === 'standard' ? '🐾' : '🦕'}
                        </div>
                        <div className="action-count">
                            <span className="number">
                                {selectedMethod 
                                    ? actionsNeeded.toLocaleString() 
                                    : '---'}
                            </span>
                            <span className="label">
                                {calcMode === 'standard' ? 'Catches Needed' : 'Kills Needed'}
                            </span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p>
                            <span>Starting Level:</span>
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

export default HunterCalculator;
