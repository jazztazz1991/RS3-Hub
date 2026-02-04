import React, { useState, useEffect } from 'react';
import { summoningData } from '../../../data/summoningData';
import { useCharacter } from '../../../context/CharacterContext';
import './SummoningCalculator.css';

const SummoningCalculator = () => {
    const { character } = useCharacter();
    const [currentXp, setCurrentXp] = useState(0);
    const [targetXp, setTargetXp] = useState(13034431);
    const [calcMode, setCalcMode] = useState('standard'); // 'standard' | 'ancient'
    
    // Modifiers
    const [useOutfit, setUseOutfit] = useState(false); // Shaman's Outfit +6%
    const [useVos, setUseVos] = useState(false); // Voice of Seren +20%
    const [useIncense, setUseIncense] = useState(false); // Can be relevant, but maybe stick to major ones. Actually Torstol works? Let's just do outfit/vos.

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [charmFilter, setCharmFilter] = useState('All');

    // Load character data
    useEffect(() => {
        if (character?.skills?.Summoning) {
            setCurrentXp(character.skills.Summoning.xp);
            setTargetXp(character.skills.Summoning.level < 99 ? 13034431 : 104273167);
        }
    }, [character]);

    const activeData = summoningData[calcMode] || [];

    // Filter Logic
    const filteredMethods = activeData.filter(method => {
        const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCharm = charmFilter === 'All' || method.charm === charmFilter;
        return matchesSearch && matchesCharm;
    });

    const charms = ['All', 'Gold', 'Green', 'Crimson', 'Blue'];

    // XP Calculation
    const getXpPerAction = (baseXp) => {
        let multiplier = 1;
        if (useOutfit) multiplier += 0.06;
        if (useVos) multiplier += 0.20;
        return baseXp * multiplier;
    };

    const remainingXp = Math.max(0, targetXp - currentXp);
    const xpPerAction = selectedMethod ? getXpPerAction(selectedMethod.xp) : 0;
    const actionsNeeded = selectedMethod ? Math.ceil(remainingXp / xpPerAction) : 0;
    
    // Mat calc
    const shardsNeeded = selectedMethod ? actionsNeeded * selectedMethod.shards : 0;
    // Spirit Shards sell/buy back returns ?? No, just pure consumption for now.

    const handleMethodSelect = (method) => {
        setSelectedMethod(method);
    };

    const toggleMode = (mode) => {
        setCalcMode(mode);
        setSelectedMethod(null);
        setCharmFilter('All');
        setSearchTerm('');
    };

    return (
        <div className="summoning-calculator">
            <h2>Summoning Calculator</h2>

            {/* Modifiers */}
            <div className="modifiers">
                <label className="checkbox-container" title="Shaman's Outfit (+6%)">
                    <input 
                        type="checkbox" 
                        checked={useOutfit} 
                        onChange={(e) => setUseOutfit(e.target.checked)} 
                    />
                    Shaman's Outfit (+6%)
                </label>
                <label className="checkbox-container" title="Voice of Seren (Amlodd) (+20%)">
                    <input 
                        type="checkbox" 
                        checked={useVos} 
                        onChange={(e) => setUseVos(e.target.checked)} 
                    />
                    Voice of Seren (+20%)
                </label>
            </div>

            {/* Mode Toggle */}
            <div className="mode-toggle">
                <button 
                    className={`mode-btn ${calcMode === 'standard' ? 'active' : ''}`}
                    onClick={() => toggleMode('standard')}
                >
                    <span className="emoji">🐺</span> Standard Pouches
                </button>
                <button 
                    className={`mode-btn ${calcMode === 'ancient' ? 'active' : ''}`}
                    onClick={() => toggleMode('ancient')}
                >
                    <span className="emoji">👹</span> Ancient Summoning
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
                            <p className="method-xp">Base XP: {selectedMethod.xp}</p>
                            <p className="method-xp-actual">
                                Actual XP: {xpPerAction.toFixed(1)}
                            </p>
                            <p className="method-level">Level: {selectedMethod.level}</p>
                            <p className="method-charm">Charm: <span className={`charm-${selectedMethod.charm.toLowerCase()}`}>{selectedMethod.charm}</span></p>
                            
                            <div className="materials-req">
                                <p>1x Pouch</p>
                                <p>{selectedMethod.shards}x Spirit Shards</p>
                                <p>1x {selectedMethod.charm} Charm</p>
                                <p>1x {selectedMethod.material}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Middle Column: Results */}
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
                            <span className="label">Pouches Needed</span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p>
                            <span>Staying Level:</span>
                            <span>{character?.skills?.Summoning?.level || 1}</span>
                        </p>
                        <p>
                            <span>Remaining XP:</span>
                            <span>{remainingXp.toLocaleString()}</span>
                        </p>
                        <p>
                            <span>Total Shards:</span>
                            <span>{shardsNeeded.toLocaleString()}</span>
                        </p>
                    </div>
                </div>

                {/* Right Column: List */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <input 
                            type="text" 
                            placeholder="Search pouches..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select 
                            value={charmFilter}
                            onChange={(e) => setCharmFilter(e.target.value)}
                            className="category-select"
                        >
                            {charms.map(c => (
                                <option key={c} value={c}>{c}</option>
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
                                    <span className={`charm-text-${method.charm.toLowerCase()}`}>{method.charm}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummoningCalculator;
