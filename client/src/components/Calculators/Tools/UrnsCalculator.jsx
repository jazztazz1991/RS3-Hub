import React, { useState, useEffect } from 'react';
import { URN_DATA, URN_ENHANCER_BONUS } from '../../../data/items/urnsData';
import { useCharacter } from '../../../context/CharacterContext.jsx';
import { useReportCalls } from '../../../context/ReportContext';
import { XP_TABLE, getXpAtLevel } from '../../../utils/rs3';
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

    const activeUrns = URN_DATA[selectedSkill] || [];
    const selectedUrn = activeUrns[selectedUrnIndex] || activeUrns[0];

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
    
    // Effective XP per Urn Cycle = fillXp (base) + bonusXp
    // This implies that using urns effectively increases your XP rate.
    // If goal is fixed XP (e.g. Level 99), then using urns doesn't reduce the "Base XP" needed to reach it directly 
    // in the same way bonus XP usually works (Bonus XP is consumed).
    // Actually, urn bonus XP is just extra XP.
    // If I need 100k XP. I gain 4k base -> Urn fills -> I get 1k bonus. Total gain 5k.
    // So efficient XP per urn = fillXp + bonusXp.
    // Urns required = TargetXP / (FillXP + BonusXP)?
    // No, usually calculators show how many urns you fill along the way of doing the base training.
    // If you want to reach the goal FASTER using urns, that's different.
    // Let's stick to: "If I do X amount of training (XP Needed), how many urns will I fill?"
    // AND "How much EXTRA XP will I get?"
    
    // If the user treats "Target XP" as the goal including the bonus:
    // Total Gain per urn = fill + bonus.
    // Urns = XP Needed / (fill + bonus).
    
    // Most urn calculators assume you are going to grind the XP anyway, 
    // and just want to know how many to buy to cover that grind.
    // So Urns = XP Gap / Fill XP.
    
    const handleSkillChange = (e) => {
        setSelectedSkill(e.target.value);
        setSelectedUrnIndex(0); // Reset urn selection
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
                                {urn.name} (Lvl {urn.level})
                            </option>
                        ))}
                    </select>
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
                    <h3>Review</h3>
                    <p style={{fontSize: '1rem', color: '#ccc'}}>
                        Gap: {xpNeeded.toLocaleString()} XP
                    </p>
                    <p style={{fontSize: '1rem', color: '#ccc'}}>
                        Fills every: {selectedUrn.fillXp} XP
                    </p>
                </div>
                
                <div className="urns-result-card">
                    <h3>Urns Needed</h3>
                    <p>{urnsNeeded.toLocaleString()}</p>
                </div>

                <div className="urns-result-card">
                    <h3>Bonus XP Gained</h3>
                    <p>{Math.floor(totalBonusXp).toLocaleString()}</p>
                </div>
                
                <div className="urns-result-card">
                    <h3>Total XP (Base + Bonus)</h3>
                    <p>{Math.floor(xpNeeded + totalBonusXp).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

export default UrnsCalculator;
