import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { RC_ALTARS, RUNESPAN_NODES } from '../../../data/runecraftingData';
import { getXpAtLevel } from '../../../utils/rs3';
import './RunecraftingCalculator.css';

const RunecraftingCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();
    
    // State
    const [currentLevel, setCurrentLevel] = useState(1);
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(getXpAtLevel(99));
    
    // Mode Selection: 'altar' or 'span'
    const [calcMode, setCalcMode] = useState('altar');
    
    // Selections
    const [selectedAltar, setSelectedAltar] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    
    // Modifiers
    const [useDaeyalt, setUseDaeyalt] = useState(false);
    const [useDemonicSkull, setUseDemonicSkull] = useState(false);

    // Filter Logic
    const [altarCategory, setAltarCategory] = useState('All');
    const [spanCategory, setSpanCategory] = useState('All');

    // Initialize from character data
    useEffect(() => {
        updateReportContext({
           tool: 'Runecrafting Calculator',
           state: {
               level: currentLevel,
               target: targetLevel,
               mode: calcMode,
               altar: selectedAltar?.name,
               node: selectedNode?.name,
               modifiers: { daeyalt: useDaeyalt, demonicSkull: useDemonicSkull }
           }
       });
       return () => clearReportContext();
    }, [currentLevel, targetLevel, calcMode, selectedAltar, selectedNode, useDaeyalt, useDemonicSkull]);

    useEffect(() => {
        if (characterData && Array.isArray(characterData)) {
            const skill = characterData.find(s => s.name === "Runecrafting");
            if (skill) {
                setCurrentLevel(skill.level);
                setCurrentXp(skill.xp);
            }
        }
    }, [characterData]);

    const handleLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setCurrentLevel(Math.min(120, Math.max(1, level)));
        setCurrentXp(getXpAtLevel(level));
    };

    const handleTargetLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setTargetLevel(Math.min(120, Math.max(1, level)));
        setTargetXp(getXpAtLevel(level));
    };

    // Derived
    const remainingXp = Math.max(0, targetXp - currentXp);

    // Multiplier Logic
    const getFinalXp = (baseXp) => {
        let xp = baseXp;
        if (calcMode === 'altar') {
            if (useDaeyalt) xp *= 1.5;
            if (useDemonicSkull && selectedAltar?.id !== 'soul') xp *= 3.5; // Skull applies to Abyss
        }
        return xp;
    };

    // Filter Lists
    const altarCategories = ['All', ...new Set(RC_ALTARS.map(m => m.category))];
    const filteredAltars = RC_ALTARS.filter(c => 
        altarCategory === 'All' || c.category === altarCategory
    ).sort((a,b) => b.level - a.level);

    const spanCategories = ['All', ...new Set(RUNESPAN_NODES.map(m => m.category))];
    const filteredNodes = RUNESPAN_NODES.filter(n => 
        spanCategory === 'All' || n.category === spanCategory
    ).sort((a,b) => b.level - a.level);

    return (
        <div className="runecrafting-calculator">
            <h2>Runecrafting Calculator</h2>

            <div className="calc-layout">
                {/* 1. Stats Column */}
                <div className="card input-section">
                    <h3>Current Stats</h3>
                    <div className="input-group">
                        <label>Level</label>
                        <input 
                            type="number" 
                            value={currentLevel} 
                            onChange={handleLevelChange}
                            min="1" max="120"
                        />
                    </div>
                    <div className="input-group">
                        <label>Experience</label>
                        <input 
                            type="number" 
                            value={currentXp} 
                            onChange={(e) => setCurrentXp(parseInt(e.target.value) || 0)}
                            min="0"
                        />
                    </div>

                    <h3>Target</h3>
                    <div className="input-group">
                        <label>Level</label>
                        <input 
                            type="number" 
                            value={targetLevel} 
                            onChange={handleTargetLevelChange}
                            min="1" max="120"
                        />
                    </div>
                    <div className="helper-text">
                        XP needed: {remainingXp.toLocaleString()}
                    </div>
                </div>

                {/* 2. Middle Column - Dual Mode Switching */}
                <div className="card methods-section">
                    <div className="mode-toggle">
                        <button 
                            className={`mode-btn ${calcMode === 'altar' ? 'active' : ''}`}
                            onClick={() => setCalcMode('altar')}
                        >
                            <span className="emoji">⚡</span> Altars
                        </button>
                        <button 
                            className={`mode-btn ${calcMode === 'span' ? 'active' : ''}`}
                            onClick={() => setCalcMode('span')}
                        >
                            <span className="emoji">🌀</span> Runespan
                        </button>
                    </div>
                    
                    {/* Modifiers (Altar Only) */}
                    {calcMode === 'altar' && (
                        <div className="modifiers">
                            <label className="checkbox-container">
                                <input 
                                    type="checkbox" 
                                    checked={useDaeyalt} 
                                    onChange={(e) => setUseDaeyalt(e.target.checked)} 
                                />
                                <span className="checkmark"></span>
                                Daeyalt Essence (+50%)
                            </label>
                            <label className="checkbox-container">
                                <input 
                                    type="checkbox" 
                                    checked={useDemonicSkull} 
                                    onChange={(e) => setUseDemonicSkull(e.target.checked)} 
                                />
                                <span className="checkmark"></span>
                                Demonic Skull (Abyss 3.5x)
                            </label>
                        </div>
                    )}

                    {calcMode === 'altar' ? (
                        <div className="method-list">
                            <div className="methods-header">
                                <h3>Select Rune</h3>
                                <select 
                                    className="category-select"
                                    value={altarCategory}
                                    onChange={(e) => setAltarCategory(e.target.value)}
                                >
                                    {altarCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="methods-grid">
                                {filteredAltars.filter(x => x.xp > 0).map(rune => (
                                    <div 
                                        key={rune.id}
                                        className={`method-btn ${selectedAltar?.id === rune.id ? 'active' : ''} ${rune.level > currentLevel ? 'locked' : ''}`}
                                        onClick={() => setSelectedAltar(rune)}
                                    >
                                        <div className="method-name">{rune.name}</div>
                                        <div className="method-details">
                                            <span>Lvl {rune.level}</span>
                                            <span>{getFinalXp(rune.xp).toFixed(1)} XP</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="method-list">
                            <div className="methods-header">
                                <h3>Select Node</h3>
                                <select 
                                    className="category-select"
                                    value={spanCategory}
                                    onChange={(e) => setSpanCategory(e.target.value)}
                                >
                                    {spanCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="methods-grid">
                                {filteredNodes.map(node => (
                                    <div 
                                        key={node.id}
                                        className={`method-btn ${selectedNode?.id === node.id ? 'active' : ''} ${node.level > currentLevel ? 'locked' : ''}`}
                                        onClick={() => setSelectedNode(node)}
                                    >
                                        <div className="method-name">{node.name}</div>
                                        <div className="method-details">
                                            <span>Lvl {node.level}</span>
                                            <span>{node.xp} XP</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Results Column */}
                <div className="card results-section">
                    <h3>Results</h3>
                    
                    {calcMode === 'altar' && selectedAltar && (
                        <div className="results-content">
                            <div className="result-main">
                                <div className="action-icon">⚡</div>
                                <div className="action-count">
                                    <span className="number">
                                        {Math.ceil(remainingXp / getFinalXp(selectedAltar.xp)).toLocaleString()}
                                    </span>
                                    <span className="label">Essence Required</span>
                                </div>
                            </div>
                            <div className="result-details">
                                <p><span>Rune:</span> <strong>{selectedAltar.name}</strong></p>
                                <p><span>Base XP:</span> <strong>{selectedAltar.xp}</strong></p>
                                <p><span>Final XP:</span> <strong>{getFinalXp(selectedAltar.xp).toFixed(1)}</strong></p>
                            </div>
                        </div>
                    )}

                    {calcMode === 'span' && selectedNode && (
                        <div className="results-content">
                            <div className="result-main">
                                <div className="action-icon">🌀</div>
                                <div className="action-count">
                                    <span className="number">
                                        {Math.ceil(remainingXp / selectedNode.xp).toLocaleString()}
                                    </span>
                                    <span className="label">Siphons</span>
                                </div>
                            </div>
                            <div className="result-details">
                                <p><span>Node:</span> <strong>{selectedNode.name}</strong></p>
                                <p><span>Floor:</span> <strong>{selectedNode.category}</strong></p>
                                <p><span>XP Per Siphon:</span> <strong>{selectedNode.xp}</strong></p>
                            </div>
                        </div>
                    )}
                    
                    {((calcMode === 'altar' && !selectedAltar) || (calcMode === 'span' && !selectedNode)) && (
                        <div className="no-selection"><p>Select a method</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RunecraftingCalculator;
