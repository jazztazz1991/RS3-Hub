import React, { useState, useEffect } from 'react';
import { URN_DATA, URN_ENHANCER_BONUS } from '../../../data/items/urnsData';
import { useCharacter } from '../../../context/CharacterContext.jsx';
import { useReportCalls } from '../../../context/ReportContext';
import { XP_TABLE, getXpAtLevel, getLevelAtXp } from '../../../utils/rs3';
import './UrnsCalculator.css';

const UrnsCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();
    const skills = Object.keys(URN_DATA);

    const [selectedSkill, setSelectedSkill] = useState(skills[0]);
    const [selectedUrnIndex, setSelectedUrnIndex] = useState(0); // Index in the specific skill array
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(XP_TABLE[99]);
    const [useEnhancer, setUseEnhancer] = useState(false);

    // Update XP when skill changes or character data loads
    useEffect(() => {
        updateReportContext({
            tool: 'Urns Calculator',
            state: {
                skill: selectedSkill,
                urnIndex: selectedUrnIndex,
                enhancer: useEnhancer
            }
        });
        return () => clearReportContext();
    }, [selectedSkill, selectedUrnIndex, useEnhancer, updateReportContext, clearReportContext]);

    useEffect(() => {
        if (characterData) {
            const skillData = characterData.find(s => s.name === selectedSkill) || 
                              characterData.find(s => s.name === selectedSkill.replace('ing', '')); // Handle naming differences if any
            
            // Note: Standardize skill names in URN_DATA vs characterData
            // URN_DATA keys: "Mining", "Fishing" etc.
            // characterData: "Mining", "Fishing"... should match.
            
            if (skillData) {
                setCurrentXp(skillData.xp);
                // Default target to next significant milestone
                const currentLevel = skillData.level;
                if (currentLevel < 99) setTargetLevel(99);
                else if (currentLevel < 120) setTargetLevel(120);
                else setTargetLevel(120);
            }
        }
    }, [characterData, selectedSkill]);

    // Update target XP when level changes
    useEffect(() => {
        setTargetXp(getXpAtLevel(targetLevel));
    }, [targetLevel]);

    // Auto-select the highest-tier urn available at the current level
    useEffect(() => {
        const level = getLevelAtXp(currentXp);
        const urns = URN_DATA[selectedSkill] || [];
        let bestIdx = 0;
        for (let i = 0; i < urns.length; i++) {
            if (urns[i].level <= level) bestIdx = i;
        }
        setSelectedUrnIndex(bestIdx);
    }, [selectedSkill, currentXp]);

    const activeUrns = URN_DATA[selectedSkill] || [];
    const selectedUrn = activeUrns[selectedUrnIndex] || activeUrns[0];
    const currentLevel = getLevelAtXp(currentXp);
    const bestUrnIndex = activeUrns.reduce((best, urn, i) => urn.level <= currentLevel ? i : best, 0);
    const bestUrn = activeUrns[bestUrnIndex];

    // Calculations
    const xpNeeded = Math.max(0, targetXp - currentXp);
    
    // Urn Logic
    // An urn fills after `fillXp` experience is gained.
    // So for every chunk of `fillXp`, one urn is consumed.
    // If you need 1,000,000 XP and urn fills at 4,000:
    // Urns = Ceil(1,000,000 / 4,000)
    
    const urnsNeeded = Math.ceil(xpNeeded / selectedUrn.fillXp);
    
    // Bonus XP
    // Each urn gives `bonusXp`. Enhancer increases this.
    // Bonus XP is AWARDED when the urn is full and teleported.
    // The "fillXp" is regular XP gained from the skill.
    
    let bonusPerUrn = selectedUrn.bonusXp;
    if (useEnhancer) {
        bonusPerUrn *= (1 + URN_ENHANCER_BONUS);
    }
    
    const totalBonusXp = urnsNeeded * bonusPerUrn;

    // Rate boost: extra XP % per urn cycle — answers "is it worth it?"
    // e.g. mining urn (fill 3000, bonus 750) = +25%. With enhancer: +31.25%.
    const rateBoostPct = selectedUrn.fillXp > 0
        ? (bonusPerUrn / selectedUrn.fillXp) * 100
        : 0;
    
    const handleSkillChange = (e) => {
        setSelectedSkill(e.target.value);
    };

    return (
        <div className="urns-calculator-container">
            <h2>Urns Calculator</h2>

            <div className="urns-controls">
                
                {/* Skill Selection */}
                <div className="urns-control-group">
                    <label>Skill</label>
                    <select value={selectedSkill} onChange={handleSkillChange}>
                        {skills.map(skill => (
                            <option key={skill} value={skill}>{skill}</option>
                        ))}
                    </select>
                </div>

                {/* Urn Selection */}
                <div className="urns-control-group">
                    <label>Urn Type</label>
                    <select
                        value={selectedUrnIndex}
                        onChange={(e) => setSelectedUrnIndex(Number(e.target.value))}
                    >
                        {activeUrns.map((urn, index) => (
                            <option key={index} value={index}>
                                {urn.name} (Lvl {urn.level}){index === bestUrnIndex ? ' ★' : ''}
                            </option>
                        ))}
                    </select>
                    {bestUrn && (
                        <span className="urns-rec-hint">
                            ★ Best for level {currentLevel}: {bestUrn.name}
                            {selectedUrnIndex !== bestUrnIndex && (
                                <button
                                    className="urns-rec-apply"
                                    onClick={() => setSelectedUrnIndex(bestUrnIndex)}
                                >
                                    Use this
                                </button>
                            )}
                        </span>
                    )}
                </div>
                
                {/* Enhancer Toggle */}
                <div className="urns-control-group" style={{justifyContent: 'center'}}>
                     <label className="urns-enhancer-toggle">
                        <input 
                            type="checkbox" 
                            checked={useEnhancer} 
                            onChange={(e) => setUseEnhancer(e.target.checked)}
                        />
                        Use Urn Enhancer (+25% XP)
                    </label>
                </div>

                {/* Current XP */}
                <div className="urns-control-group">
                    <label>Current XP</label>
                    <input 
                        type="number" 
                        value={currentXp} 
                        onChange={(e) => setCurrentXp(Math.max(0, Number(e.target.value)))}
                    />
                </div>

                {/* Target Level */}
                 <div className="urns-control-group">
                    <label>Target Level</label>
                    <input 
                        type="number" 
                        value={targetLevel} 
                        onChange={(e) => setTargetLevel(Math.min(120, Math.max(1, Number(e.target.value))))}
                    />
                </div>
                
                 {/* Target XP (Display/Edit) */}
                 <div className="urns-control-group">
                    <label>Target XP</label>
                    <input 
                        type="number" 
                        value={targetXp} 
                        onChange={(e) => setTargetXp(Math.max(0, Number(e.target.value)))}
                    />
                </div>
            </div>

            <div className="urns-results">
                <div className="urns-result-card">
                    <h3>Urns needed</h3>
                    <p>{urnsNeeded.toLocaleString()}</p>
                    <span className="urns-result-sub">fills every {selectedUrn.fillXp.toLocaleString()} XP</span>
                </div>

                <div className="urns-result-card">
                    <h3>Bonus XP from urns</h3>
                    <p>{Math.floor(totalBonusXp).toLocaleString()}</p>
                    <span className="urns-result-sub">extra XP on top of base training</span>
                </div>

                <div className="urns-result-card">
                    <h3>XP rate boost</h3>
                    <p>+{rateBoostPct.toFixed(1)}%</p>
                    <span className="urns-result-sub">effective XP per action{useEnhancer ? ' (with enhancer)' : ''}</span>
                </div>

                <div className="urns-result-card">
                    <h3>Total XP gain</h3>
                    <p>{Math.floor(xpNeeded + totalBonusXp).toLocaleString()}</p>
                    <span className="urns-result-sub">{xpNeeded.toLocaleString()} base + {Math.floor(totalBonusXp).toLocaleString()} bonus</span>
                </div>
            </div>
        </div>
    );
};

export default UrnsCalculator;
