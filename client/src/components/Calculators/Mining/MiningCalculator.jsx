import React, { useState, useEffect, useMemo } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { MINING_ROCKS } from '../../../data/miningData';
import { XP_TABLE, getLevelAtXp, getXpAtLevel, getTargetXp } from '../../../utils/rs3';
import './MiningCalculator.css';

const MiningCalculator = () => {
    const { characterData } = useCharacter();
    
    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(XP_TABLE[99]);
    const [selectedRockId, setSelectedRockId] = useState('banite');

    // Initialize from Character Context
    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const skill = characterData.find(s => s.name === "Mining");
            if (skill) {
                setCurrentXp(skill.xp);
                // Smart target setting
                if (skill.level < 99) setTargetLevel(99);
                else if (skill.level < 110) setTargetLevel(110); // Mining goes to 110
                else setTargetLevel(120);
            }
        }
    }, [characterData]);

    // Update Target XP when Target Level changes
    useEffect(() => {
        setTargetXp(getXpAtLevel(targetLevel));
    }, [targetLevel]);

    const handleLevelChange = (e) => {
        const lvl = parseInt(e.target.value) || 1;
        setTargetLevel(lvl);
    };

    const handleXpChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setCurrentXp(val);
    };

    // Calculation
    const selectedRock = MINING_ROCKS.find(m => m.id === selectedRockId);
    const xpRemaining = Math.max(0, targetXp - currentXp);
    const actionsNeeded = selectedRock && selectedRock.xp > 0 
        ? Math.ceil(xpRemaining / selectedRock.xp) 
        : 0;

    // Progress
    const currentLevel = getLevelAtXp(currentXp);
    const progressPercent = Math.min(100, (currentLevel / targetLevel) * 100);

    return (
        <div className="mining-calculator">
            <h2>Mining Calculator</h2>
            
            <div className="calc-layout">
                {/* Inputs Info */}
                <div className="calc-inputs card">
                    <h3>Current Status</h3>
                    <div className="input-group">
                        <label>Current XP</label>
                        <input 
                            type="number" 
                            value={currentXp} 
                            onChange={handleXpChange} 
                        />
                        <span className="helper-text">Level: {currentLevel}</span>
                    </div>

                    <div className="input-group">
                        <label>Target Level</label>
                        <input 
                            type="number" 
                            value={targetLevel} 
                            onChange={handleLevelChange}
                            max={120}
                        />
                        <span className="helper-text">Target XP: {targetXp.toLocaleString()}</span>
                    </div>

                    <div className="xp-remaining-box">
                        <span className="label">XP Remaining</span>
                        <span className="value">{xpRemaining.toLocaleString()}</span>
                    </div>
                </div>

                {/* Rock Selector */}
                <div className="calc-methods card">
                    <h3>Select Rock</h3>
                    <div className="methods-grid">
                        {MINING_ROCKS.map(rock => (
                            <button
                                key={rock.id}
                                className={`method-btn ${selectedRockId === rock.id ? 'active' : ''} ${currentLevel < rock.level ? 'locked' : ''}`}
                                onClick={() => setSelectedRockId(rock.id)}
                            >
                                <div className="method-name">{rock.name}</div>
                                <div className="method-details">
                                    <span className="level-req">Lvl {rock.level}</span>
                                    <span className="xp-val">{rock.xp} XP</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                <div className="calc-results card">
                    <h3>Results</h3>
                    <div className="result-main">
                        <div className="action-icon">⛏️</div>
                        <div className="action-count">
                            <span className="number">{actionsNeeded.toLocaleString()}</span>
                            <span className="label">Ores/Actions Needed</span>
                        </div>
                    </div>
                    
                    <div className="result-details">
                         <p>Method: <strong>{selectedRock?.name}</strong></p>
                         <p>XP Per Action: <strong>{selectedRock?.xp}</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiningCalculator;
