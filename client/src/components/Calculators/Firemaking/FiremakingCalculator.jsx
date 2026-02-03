import React, { useState, useEffect, useMemo } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { FIREMAKING_ITEMS, FIREMAKING_BOOSTS } from '../../../data/firemakingData';
import { XP_TABLE, getLevelAtXp, getXpAtLevel } from '../../../utils/rs3';
import './FiremakingCalculator.css';

const FiremakingCalculator = () => {
    // State
    // Try to initialize directly from context if available immediately, otherwise default to 0
    const { characterData } = useCharacter();
    
    // Helper to find initial data without effect if possible
    const initialSkill = React.useMemo(() => 
        characterData ? characterData.find(s => s.name === "Firemaking") : null
    , [characterData]);

    const [currentXp, setCurrentXp] = useState(initialSkill ? initialSkill.xp : 0);
    const [targetLevel, setTargetLevel] = useState(() => {
        if (initialSkill) {
            return initialSkill.level < 99 ? 99 : 120;
        }
        return 99;
    });
    
    // Derived State
    const targetXp = useMemo(() => getXpAtLevel(targetLevel), [targetLevel]);
    
    const [selectedItemId, setSelectedItemId] = useState('magic'); // Default to Magic Logs
    const [activeBoosts, setActiveBoosts] = useState(['bonfire']); 
    
    const hasInitialized = React.useRef(!!initialSkill);

    // Initialize from Character Context (Only if it arrives later)
    useEffect(() => {
        if (!hasInitialized.current && initialSkill) {
             setCurrentXp(initialSkill.xp);
             setTargetLevel(initialSkill.level < 99 ? 99 : 120);
             hasInitialized.current = true;
        }
    }, [initialSkill]);

    // Update Target XP effect removed (calculated above)

    const handleBoostToggle = (boostId) => {
        setActiveBoosts(prev => {
            if (prev.includes(boostId)) {
                return prev.filter(id => id !== boostId);
            } else {
                return [...prev, boostId];
            }
        });
    };

    const selectedItem = FIREMAKING_ITEMS.find(i => i.id === selectedItemId) || FIREMAKING_ITEMS[0];

    // Calculations
    const calculateResults = () => {
        const remaining = Math.max(0, targetXp - currentXp);
        
        // Determine Base XP (Line vs Bonfire)
        const isBonfire = activeBoosts.includes('bonfire');
        const baseXP = isBonfire ? selectedItem.bonfireXp : selectedItem.xp;
        
        if (baseXP === null) {
            // Fallback if no bonfire XP exists for item (like specials), use base
            // But we should warn or handle this?
            // Usually if bonfireXp is null, it means it doesn't support it, so just use base.
        }
        
        const effectiveBase = (isBonfire && selectedItem.bonfireXp) ? selectedItem.bonfireXp : selectedItem.xp;

        // Add % Multipliers
        let percentageBonus = 0;
        activeBoosts.forEach(boostId => {
            const boost = FIREMAKING_BOOSTS.find(b => b.id === boostId);
            if (boost && boost.type !== 'method_override') {
                 percentageBonus += boost.multiplier;
            }
        });

        const xpPerAction = effectiveBase * (1 + percentageBonus);
        const actionsNeeded = Math.ceil(remaining / xpPerAction);
        
        return {
            remaining,
            xpPerAction: xpPerAction.toFixed(1),
            actionsNeeded,
            itemName: selectedItem.name,
            totalBonus: (percentageBonus * 100).toFixed(1) + '%',
            method: isBonfire ? 'Bonfire' : 'Line Firemaking'
        };
    };

    const results = calculateResults();

    return (
        <div className="firemaking-calculator-container">
            <h2>Firemaking Calculator</h2>
            
            <div className="calculator-layout">
                {/* Inputs Section */}
                <div className="input-section">
                    <div className="input-group">
                        <label>Current XP</label>
                        <input 
                            type="number" 
                            value={currentXp} 
                            onChange={(e) => setCurrentXp(parseInt(e.target.value) || 0)}
                        />
                         <span className="helper-text lvl-helper">Level: {getLevelAtXp(currentXp)}</span>
                    </div>

                    <div className="input-group">
                        <label>Target Level</label>
                        <input 
                            type="number" 
                            value={targetLevel} 
                            onChange={(e) => setTargetLevel(parseInt(e.target.value) || 1)}
                            min="1" max="120"
                        />
                        <span className="helper-text lvl-helper">XP: {targetXp.toLocaleString()}</span>
                    </div>

                     <div className="selection-grids">
                        <div className="grid-column">
                            <h4 className="grid-label">Log Type</h4>
                            <div className="item-list">
                                {FIREMAKING_ITEMS.map(item => (
                                    <div 
                                        key={item.id} 
                                        className={`selection-card ${selectedItemId === item.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedItemId(item.id)}
                                    >
                                        <div className="card-header">
                                            <h4>{item.name}</h4>
                                            <span className="level-req">Lvl {item.level}</span>
                                        </div>
                                        <span className="xp-val">{item.xp} XP</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="grid-column">
                             <h4 className="grid-label">Boosts / Methods</h4>
                            <div className="method-list">
                                {FIREMAKING_BOOSTS.map(boost => (
                                    <div 
                                        key={boost.id} 
                                        className={`selection-card ${activeBoosts.includes(boost.id) ? 'selected' : ''}`}
                                        onClick={() => handleBoostToggle(boost.id)}
                                    >
                                        <div className="card-header">
                                            <h4>{boost.name}</h4>
                                        </div>
                                        {boost.multiplier > 0 && <span className="xp-val">+{boost.multiplier * 100}%</span>}
                                        <div style={{fontSize: '0.8rem', color: '#888'}}>{boost.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                </div>

                {/* Results Section */}
                <div className="results-section">
                    <h3>Projections</h3>
                    <div className="results-grid">
                        <div className="result-card">
                            <h4>XP Remaining</h4>
                            <span className="value">{results.remaining.toLocaleString()}</span>
                        </div>
                        <div className="result-card">
                            <h4>XP per Log</h4>
                            <span className="value">{results.xpPerAction}</span>
                            <span className="sub-value">{results.method}</span>
                        </div>
                        <div className="result-card highlight">
                            <h4>Logs Needed</h4>
                            <span className="value">{results.actionsNeeded.toLocaleString()}</span>
                            <span className="sub-value">Bonus: {results.totalBonus}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FiremakingCalculator;
