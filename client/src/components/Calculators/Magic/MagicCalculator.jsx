import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { MAGIC_SPELLS, SPELLBOOK_TYPES } from '../../../data/magicData';
import { XP_TABLE, getLevelAtXp, getXpAtLevel } from '../../../utils/rs3';
import './MagicCalculator.css';

const MagicCalculator = () => {
    const { characterData } = useCharacter();

    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(XP_TABLE[99]);
    const [selectedSpellId, setSelectedSpellId] = useState(MAGIC_SPELLS[0]?.id || 'high_alchemy');
    const [spellbookFilter, setSpellbookFilter] = useState('All');

    // Initialize
    useEffect(() => {
        if (characterData) {
            const skill = characterData.find(s => s.name === "Magic");
            if (skill) {
                setCurrentXp(skill.xp);
                if (skill.level < 99) setTargetLevel(99);
                else setTargetLevel(120);
            }
        }
    }, [characterData]);

    // Target XP
    useEffect(() => {
        setTargetXp(getXpAtLevel(targetLevel));
    }, [targetLevel]);

    const handleLevelChange = (e) => setTargetLevel(Math.min(120, Math.max(1, parseInt(e.target.value) || 1)));
    const handleXpChange = (e) => setCurrentXp(Math.max(0, parseInt(e.target.value) || 0));

    // Derived
    const currentLevel = getLevelAtXp(currentXp);
    const remainingXp = Math.max(0, targetXp - currentXp);
    const selectedSpell = MAGIC_SPELLS.find(s => s.id === selectedSpellId) || MAGIC_SPELLS[0];

    const xpPerCast = selectedSpell.xp;
    const castsNeeded = xpPerCast > 0 ? Math.ceil(remainingXp / xpPerCast) : 0;
    
    // Filter
    // SPELLBOOK_TYPES might be an object { STANDARD: 'Standard', ... }
    const spellbooks = ['All', ...new Set(MAGIC_SPELLS.map(s => s.book))];
    const filteredSpells = spellbookFilter === 'All' 
        ? MAGIC_SPELLS 
        : MAGIC_SPELLS.filter(s => s.book === spellbookFilter);

    return (
        <div className="magic-calculator">
            <h2>Magic Calculator (Non-Combat)</h2>
            
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

                    {selectedSpell && (
                        <div className="selected-method-card">
                            <h3>{selectedSpell.name}</h3>
                            <p style={{color: '#90caf9'}}>Lvl {selectedSpell.level} - {selectedSpell.book}</p>
                            <p className="method-xp-actual">{selectedSpell.xp} XP</p>
                            <small>{selectedSpell.category}</small>
                        </div>
                    )}
                </div>

                {/* 2. Methods (Was 3) */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <h3>Select Spell</h3>
                        <div className="filter-group">
                            <select 
                                value={spellbookFilter} 
                                onChange={(e) => setSpellbookFilter(e.target.value)}
                                className="category-select"
                            >
                                {spellbooks.map(book => (
                                    <option key={book} value={book}>{book}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="methods-grid">
                        {filteredSpells.map(spell => (
                            <button
                                key={spell.id}
                                className={`method-btn ${selectedSpellId === spell.id ? 'active' : ''} ${currentLevel < spell.level ? 'locked' : ''}`}
                                onClick={() => setSelectedSpellId(spell.id)}
                            >
                                <div className="method-name">{spell.name}</div>
                                <div className="method-details">
                                    <span className="level-req">Lvl {spell.level}</span>
                                    <span className="xp-val">{spell.xp} XP</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Results (Was 2) */}
                <div className="calc-results">
                    <h3>Results</h3>
                    <div className="result-main">
                        <div className="action-icon">🔮</div>
                        <div className="action-count">
                            <span className="number">{castsNeeded.toLocaleString()}</span>
                            <span className="label">Casts Needed</span>
                        </div>
                    </div>
                    
                    <div className="result-details">
                         <p>
                            <span>Spell:</span>
                            <strong>{selectedSpell.name}</strong>
                         </p>
                         <p>
                            <span>Remaining XP:</span>
                            <strong>{remainingXp.toLocaleString()}</strong>
                         </p>
                         <p>
                             <span>Book:</span>
                             <strong>{selectedSpell.book}</strong>
                         </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MagicCalculator;
