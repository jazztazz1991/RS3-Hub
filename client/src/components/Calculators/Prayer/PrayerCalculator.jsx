import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { PRAYER_ITEMS, PRAYER_METHODS, SPECIAL_ITEMS } from '../../../data/prayerData';
import { XP_TABLE, getLevelAtXp, getXpAtLevel } from '../../../utils/rs3';
import './PrayerCalculator.css';

const PrayerCalculator = () => {
    const { characterData, selectedCharacter } = useCharacter();
    
    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(XP_TABLE[99]);
    const [selectedItem, setSelectedItem] = useState(PRAYER_ITEMS[5]); // Default Dragon Bones
    const [selectedMethod, setSelectedMethod] = useState(PRAYER_METHODS[2]); // Default Gilded Altar
    
    // Cleansing Crystal Mode
    const [isCleansingMode, setIsCleansingMode] = useState(false);
    const [cleansingVos, setCleansingVos] = useState(false);

    // Initialize from Character Context
    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const prayerSkill = characterData.find(s => s.name === "Prayer");
            if (prayerSkill) {
                setCurrentXp(prayerSkill.xp);
                // Auto-set next milestone
                const lvl = prayerSkill.level;
                if (lvl < 99) setTargetLevel(99);
                else if (lvl < 110) setTargetLevel(110);
                else if (lvl < 120) setTargetLevel(120);
                else setTargetLevel(120);
            }
        }
    }, [characterData]);

    // Update Target XP when Level Changes
    useEffect(() => {
        if (targetLevel >= 1 && targetLevel <= 120) {
            setTargetXp(getXpAtLevel(targetLevel));
        }
    }, [targetLevel]);

    // Calculations
    const calculateResults = () => {
        const remaining = Math.max(0, targetXp - currentXp);
        
        let xpPerAction = 0;
        let itemName = '';
        let multiplier = 1;

        if (isCleansingMode) {
            const crystal = SPECIAL_ITEMS[0];
            itemName = crystal.name;
            multiplier = cleansingVos ? 1.2 : 1.0;
            xpPerAction = crystal.xp * multiplier;
        } else {
            itemName = selectedItem.name;
            multiplier = selectedMethod.multiplier;
            xpPerAction = selectedItem.xp * multiplier;
        }

        const actionsNeeded = Math.ceil(remaining / xpPerAction);

        return {
            remaining,
            xpPerAction,
            actionsNeeded,
            itemName,
            methodName: isCleansingMode ? (cleansingVos ? 'Voice of Seren' : 'Standard') : selectedMethod.name
        };
    };

    const results = calculateResults();

    return (
        <div className="prayer-calculator-container">
            <h2>Prayer Calculator</h2>
            
            <div className="calculator-layout">
                {/* Inputs Section */}
                <div className="calc-panel inputs-panel">
                    <div className="input-group">
                        <label>Current XP</label>
                        <input 
                            type="number" 
                            value={currentXp} 
                            onChange={(e) => setCurrentXp(parseInt(e.target.value) || 0)}
                        />
                         <span className="helper-text">Level: {getLevelAtXp(currentXp)}</span>
                    </div>

                    <div className="input-group">
                        <label>Target Level</label>
                        <input 
                            type="number" 
                            value={targetLevel} 
                            onChange={(e) => setTargetLevel(parseInt(e.target.value) || 1)}
                            max={120}
                        />
                         <span className="helper-text">Target XP: {targetXp.toLocaleString()}</span>
                    </div>
                
                    <div className="mode-switch">
                        <button 
                            className={!isCleansingMode ? 'active' : ''} 
                            onClick={() => setIsCleansingMode(false)}
                        >
                            Bones & Ashes
                        </button>
                        <button 
                            className={isCleansingMode ? 'active' : ''} 
                            onClick={() => setIsCleansingMode(true)}
                        >
                            Cleansing Crystals
                        </button>
                    </div>

                    {!isCleansingMode ? (
                        <>
                            <div className="input-group">
                                <label>Method</label>
                                <select 
                                    value={selectedMethod.id} 
                                    onChange={(e) => setSelectedMethod(PRAYER_METHODS.find(m => m.id === e.target.value))}
                                >
                                    {PRAYER_METHODS.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} (x{m.multiplier})</option>
                                    ))}
                                </select>
                                <p className="method-desc">{selectedMethod.description}</p>
                            </div>

                            <div className="input-group">
                                <label>Bones / Ashes</label>
                                <select 
                                    value={selectedItem.id} 
                                    onChange={(e) => setSelectedItem(PRAYER_ITEMS.find(i => i.id === e.target.value))}
                                >
                                    {PRAYER_ITEMS.map(item => (
                                        <option key={item.id} value={item.id}>{item.name} ({item.xp} base)</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <div className="input-group">
                            <label>Hefin Voice of Seren Active?</label>
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={cleansingVos} 
                                    onChange={(e) => setCleansingVos(e.target.checked)}
                                />
                                Yes (+20% XP)
                            </label>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div className="calc-panel results-panel">
                    <h3>Results</h3>
                    
                    <div className="result-row main-result">
                        <span className="label">You Need:</span>
                        <span className="value highlight">{results.actionsNeeded.toLocaleString()}</span>
                        <span className="unit">{results.itemName}s</span>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="label">XP Remaining</span>
                            <span className="value">{results.remaining.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">XP Per Action</span>
                            <span className="value">{results.xpPerAction.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Method</span>
                            <span className="value">{results.methodName}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrayerCalculator;
