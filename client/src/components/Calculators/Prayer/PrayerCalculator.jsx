import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { PRAYER_ITEMS, PRAYER_METHODS, SPECIAL_ITEMS } from '../../../data/skills/prayerData';
import { XP_TABLE, getLevelAtXp, getXpAtLevel } from '../../../utils/rs3';
import './PrayerCalculator.css';

const PrayerCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();

    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(XP_TABLE[99]);
    
    // Mode: 'bones' or 'cleansing'
    const [mode, setMode] = useState('bones');
    
    // Selections
    const [selectedItemId, setSelectedItemId] = useState(PRAYER_ITEMS[0]?.id || 'bones');
    const [selectedMethodId, setSelectedMethodId] = useState(PRAYER_METHODS.find(m => m.name.includes('Gilded'))?.id || PRAYER_METHODS[0]?.id);
    const [isVos, setIsVos] = useState(false);

    // Initialize
    useEffect(() => {
        updateReportContext({
            tool: 'Prayer Calculator',
            state: {
                xp: currentXp,
                target: targetLevel,
                mode,
                item: selectedItemId,
                method: selectedMethodId,
                vos: isVos
            }
        });
        return () => clearReportContext();
    }, [currentXp, targetLevel, mode, selectedItemId, selectedMethodId, isVos]);

    useEffect(() => {
        if (characterData) {
            const skill = characterData.find(s => s.name === "Prayer");
            if (skill) {
                setCurrentXp(skill.xp);
                if (skill.level < 99) setTargetLevel(99);
                else if (skill.level < 120) setTargetLevel(120);
            }
        }
    }, [characterData]);

    // Target Xp
    useEffect(() => {
        setTargetXp(getXpAtLevel(targetLevel));
    }, [targetLevel]);

    const handleLevelChange = (e) => setTargetLevel(Math.min(120, Math.max(1, parseInt(e.target.value) || 1)));
    const handleXpChange = (e) => setCurrentXp(Math.max(0, parseInt(e.target.value) || 0));

    // Derived Logic
    const currentLevel = getLevelAtXp(currentXp);
    const remainingXp = Math.max(0, targetXp - currentXp);
    
    let xpPerAction = 0;
    let actionName = '';
    let multiplier = 1;

    if (mode === 'cleansing') {
        const crystal = SPECIAL_ITEMS[0]; // Assuming only 1 item for now
        actionName = crystal.name;
        multiplier = isVos ? 1.2 : 1.0;
        xpPerAction = crystal.xp * multiplier;
    } else {
        const item = PRAYER_ITEMS.find(i => i.id === selectedItemId) || PRAYER_ITEMS[0];
        const method = PRAYER_METHODS.find(m => m.id === selectedMethodId) || PRAYER_METHODS[0];
        actionName = item.name;
        multiplier = method.multiplier;
        xpPerAction = item.xp * multiplier;
    }

    const actionsNeeded = xpPerAction > 0 ? Math.ceil(remainingXp / xpPerAction) : 0;

    return (
        <div className="prayer-calculator">
            <h2>Prayer Calculator</h2>
            
            <div className="calc-layout">
                {/* 1. Inputs */}
                <div className="calc-inputs">
                    <h3>Current Status</h3>
                    <div className="input-group">
                        <label>Current XP</label>
                        <input type="number" value={currentXp} onChange={handleXpChange} />
                        <span className="helper-text">Level: {currentLevel}</span>
                    </div>

                    <div className="input-group">
                        <label>Target Level</label>
                        <input type="number" value={targetLevel} onChange={handleLevelChange} />
                        <span className="helper-text">Target XP: {targetXp.toLocaleString()}</span>
                    </div>

                    <div className="input-group">
                        <label>Training Mode</label>
                        <div className="mode-switch">
                            <button 
                                className={`mode-btn ${mode === 'bones' ? 'active' : ''}`}
                                onClick={() => setMode('bones')}
                            >
                                Bones/Ashes
                            </button>
                            <button 
                                className={`mode-btn ${mode === 'cleansing' ? 'active' : ''}`}
                                onClick={() => setMode('cleansing')}
                            >
                                Cleansing
                            </button>
                        </div>
                    </div>

                    {mode === 'cleansing' && (
                        <div className="input-group">
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={isVos} 
                                    onChange={(e) => setIsVos(e.target.checked)} 
                                    style={{width: 'auto', marginRight: '0.5rem'}}
                                />
                                Voice of Seren? (+20%)
                            </label>
                        </div>
                    )}

                    <div className="selected-method-card">
                        <h3>{actionName}</h3>
                        <p className="method-xp-actual">{xpPerAction.toFixed(1)} XP</p>
                        <small>Multiplier: x{multiplier.toFixed(2)}</small>
                    </div>
                </div>

                {/* 2. Methods (Was 3) */}
                <div className="calc-methods">
                    {mode === 'bones' ? (
                        <>
                            <div className="methods-header">
                                <h3>Select Altar / Method</h3>
                                <select 
                                    value={selectedMethodId} 
                                    onChange={(e) => setSelectedMethodId(e.target.value)}
                                    className="method-select"
                                >
                                    {PRAYER_METHODS.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} (x{m.multiplier})</option>
                                    ))}
                                </select>
                            </div>
                            <h3>Select Bones / Ashes</h3>
                            <div className="methods-grid">
                                {PRAYER_ITEMS.map(item => (
                                    <button
                                        key={item.id}
                                        className={`method-btn ${selectedItemId === item.id ? 'active' : ''}`}
                                        onClick={() => setSelectedItemId(item.id)}
                                    >
                                        <div className="method-name">{item.name}</div>
                                        <div className="method-details">
                                            <span className="xp-val">{item.xp} Base XP</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="methods-grid">
                            <button className="method-btn active">
                                <div className="method-name">Cleansing Crystal</div>
                                <div className="method-details">
                                    <span className="xp-val">{SPECIAL_ITEMS[0]?.xp || 9800} XP (Full)</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* 3. Results (Was 2) */}
                <div className="calc-results">
                    <h3>Results</h3>
                    <div className="result-main">
                        <div className="action-icon">🙏</div>
                        <div className="action-count">
                            <span className="number">{actionsNeeded.toLocaleString()}</span>
                            <span className="label">Actions</span>
                        </div>
                    </div>
                    
                    <div className="result-details">
                         <p>
                            <span>Item:</span>
                            <strong>{actionName}</strong>
                         </p>
                         <p>
                            <span>Remaining XP:</span>
                            <strong>{remainingXp.toLocaleString()}</strong>
                         </p>
                         <p>
                            <span>Total Cost (Est):</span>
                            <strong> - </strong>
                         </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrayerCalculator;
