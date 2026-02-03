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
    const [selectedSpellId, setSelectedSpellId] = useState('high_alchemy');
    const [filterBook, setFilterBook] = useState('All'); 

    // Initialize from Character Context
    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const magicSkill = characterData.find(s => s.name === "Magic");
            if (magicSkill) {
                setCurrentXp(magicSkill.xp);
                // Auto-set next milestone
                const lvl = magicSkill.level;
                if (lvl < 99) setTargetLevel(99);
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

    const selectedSpell = MAGIC_SPELLS.find(s => s.id === selectedSpellId) || MAGIC_SPELLS[0];

    // Filter Logic
    const filteredSpells = MAGIC_SPELLS.filter(spell => {
        if (filterBook === 'All') return true;
        return spell.book === filterBook;
    });

    // Calculations
    const calculateResults = () => {
        const remaining = Math.max(0, targetXp - currentXp);
        const xpPerCast = selectedSpell.xp;
        const castsNeeded = Math.ceil(remaining / xpPerCast);

        return {
            remaining,
            xpPerCast,
            castsNeeded,
            spellName: selectedSpell.name,
            book: selectedSpell.book
        };
    };

    const results = calculateResults();

    return (
        <div className="magic-calculator-container">
            <h2>Non-Combat Magic Calculator</h2>
            
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

                    <div className="filter-group">
                        <label>Spellbook Filter</label>
                        <div className="book-filters">
                            <button 
                                className={filterBook === 'All' ? 'active' : ''} 
                                onClick={() => setFilterBook('All')}
                            >
                                All
                            </button>
                            <button 
                                className={filterBook === SPELLBOOK_TYPES.STANDARD ? 'active' : ''} 
                                onClick={() => setFilterBook(SPELLBOOK_TYPES.STANDARD)}
                            >
                                Standard
                            </button>
                            <button 
                                className={filterBook === SPELLBOOK_TYPES.LUNAR ? 'active' : ''} 
                                onClick={() => setFilterBook(SPELLBOOK_TYPES.LUNAR)}
                            >
                                Lunar
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Select Spell</label>
                        <select 
                            value={selectedSpellId} 
                            onChange={(e) => setSelectedSpellId(e.target.value)}
                            className="spell-select"
                        >
                            {filteredSpells.map(spell => (
                                <option key={spell.id} value={spell.id}>
                                    {spell.name} (Lvl {spell.level}) - {spell.xp} XP
                                </option>
                            ))}
                        </select>
                        <p className="spell-meta">
                            Category: <span className="highlight">{selectedSpell.category}</span> • 
                            Book: <span className="highlight">{selectedSpell.book}</span>
                        </p>
                    </div>
                </div>

                {/* Results Section */}
                <div className="calc-panel results-panel">
                    <h3>Results</h3>
                    
                    <div className="result-row main-result">
                        <span className="label">You Need:</span>
                        <span className="value highlight">{results.castsNeeded.toLocaleString()}</span>
                        <span className="unit">Casts</span>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="label">XP Remaining</span>
                            <span className="value">{results.remaining.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">XP Per Cast</span>
                            <span className="value">{results.xpPerCast}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Spell</span>
                            <span className="value">{results.spellName}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MagicCalculator;
