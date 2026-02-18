import React, { useState, useEffect } from 'react';
import { divinationData } from '../../../data/divinationData';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { getXpAtLevel, getLevelAtXp } from '../../../utils/rs3';
import './DivinationCalculator.css';

const DivinationCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();
    const [currentXp, setCurrentXp] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(13034431);
    const [calcMode, setCalcMode] = useState('wisps'); // 'wisps' | 'hall' | 'dailies'
    
    // Modifiers
    const [useOutfit, setUseOutfit] = useState(false); // Elder Divination +6%
    const [useIncense, setUseIncense] = useState(false); // Torstol +2%
    const [useEnhanced, setUseEnhanced] = useState(false); // Enhanced Experience (Energy -> XP) ~+25% per action roughly

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Load character data
    useEffect(() => {
        updateReportContext({
            tool: 'Divination Calculator',
            state: {
                level: currentLevel,
                target: targetLevel,
                mode: calcMode,
                method: selectedMethod?.name,
                modifiers: { outfit: useOutfit, incense: useIncense, enhanced: useEnhanced }
            }
        });
        return () => clearReportContext();
    }, [currentLevel, targetLevel, calcMode, selectedMethod, useOutfit, useIncense, useEnhanced]);

    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const skill = characterData.find(s => s.name === "Divination");
            if (skill) {
                setCurrentXp(skill.xp);
                setCurrentLevel(skill.level);
            }
        }
    }, [characterData]);

    const handleCurrentLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setCurrentLevel(level);
        setCurrentXp(getXpAtLevel(level));
    };

    const handleCurrentXpChange = (e) => {
        const xp = parseInt(e.target.value) || 0;
        setCurrentXp(xp);
        setCurrentLevel(getLevelAtXp(xp));
    };

    const handleTargetLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setTargetLevel(level);
        setTargetXp(getXpAtLevel(level));
    };

    const handleTargetXpChange = (e) => {
        const xp = parseInt(e.target.value) || 0;
        setTargetXp(xp);
        setTargetLevel(getLevelAtXp(xp));
    };

    const activeData = divinationData[calcMode] || [];

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

        // Enhanced Experience Mode (Simulated Generic Multiplier/Addition for Energy cost)
        // In reality, it changes the deposit value. For this estimator, we'll apply a modifier.
        if (useEnhanced && calcMode === 'wisps') {
            xp = xp * 1.25; 
        }

        let multiplier = 1;
        if (useOutfit) multiplier += 0.06;
        if (useIncense) multiplier += 0.02;
        
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
        <div className="divination-calculator">
            <h2>Divination Calculator</h2>

            {/* Modifiers */}
            <div className="modifiers">
                <label className="checkbox-container" title="Elder Divination Outfit (+6%)">
                    <input 
                        type="checkbox" 
                        checked={useOutfit} 
                        onChange={(e) => setUseOutfit(e.target.checked)} 
                    />
                    Master Outfit (+6%)
                </label>
                <label className="checkbox-container" title="Use Energy for Enhanced XP (~+25%)">
                    <input 
                        type="checkbox" 
                        checked={useEnhanced} 
                        onChange={(e) => setUseEnhanced(e.target.checked)} 
                        disabled={calcMode !== 'wisps'}
                    />
                    Enhanced XP (Costs Energy)
                </label>
                <label className="checkbox-container" title="Torstol Incense (+2%)">
                    <input 
                        type="checkbox" 
                        checked={useIncense} 
                        onChange={(e) => setUseIncense(e.target.checked)} 
                    />
                    Torstol Incense (+2%)
                </label>
            </div>

            {/* Mode Toggle */}
            <div className="mode-toggle">
                <button 
                    className={`mode-btn ${calcMode === 'wisps' ? 'active' : ''}`}
                    onClick={() => toggleMode('wisps')}
                >
                    <span className="emoji">✨</span> Wisps
                </button>
                <button 
                    className={`mode-btn ${calcMode === 'hall' ? 'active' : ''}`}
                    onClick={() => toggleMode('hall')}
                >
                    <span className="emoji">🏛️</span> Hall of Memories
                </button>
                <button 
                    className={`mode-btn ${calcMode === 'dailies' ? 'active' : ''}`}
                    onClick={() => toggleMode('dailies')}
                >
                    <span className="emoji">📅</span> Caches
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
                                Calc XP: {xpPerAction.toFixed(1)}
                            </p>
                            <p className="method-cat">Type: {selectedMethod.category}</p>
                            {calcMode === 'wisps' && useEnhanced && (
                                <p className="method-detail warning">Consumes Energy!</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Middle Column: Methods */}
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

                {/* Right Column: Results */}
                <div className="calc-results">
                    <div className="result-main">
                        <div className="action-icon">
                            🔮
                        </div>
                        <div className="action-count">
                            <span className="number">
                                {selectedMethod 
                                    ? actionsNeeded.toLocaleString() 
                                    : '---'}
                            </span>
                            <span className="label">
                                {calcMode === 'dailies' ? 'Caches Needed' : 'Memories / Cores'}
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
                            <span>Est. XP/h:</span>
                            <span>Variable</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DivinationCalculator;
