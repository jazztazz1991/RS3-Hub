import React, { useState, useEffect, useMemo } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { artefacts } from '../../../data/artefacts';
import { XP_TABLE, getLevelAtXp, getTargetXp } from '../../../utils/rs3';
import './ArchaeologyCalculator.css';

const ArchaeologyCalculator = () => {
    const { characterData } = useCharacter();

    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [searchTerm, setSearchTerm] = useState('');
    const [restorationList, setRestorationList] = useState([]);

    // Initialize
    useEffect(() => {
        if (characterData) {
            const skill = characterData.find(s => s.name === "Archaeology");
            if (skill) {
                setCurrentXp(skill.xp);
                if (skill.level < 99) setTargetLevel(99);
                else if (skill.level < 120) setTargetLevel(120);
            }
        }
    }, [characterData]);

    const currentLevel = getLevelAtXp(currentXp);

    // Search Logic
    const filteredArtefacts = useMemo(() => {
        if (!searchTerm) return [];
        return artefacts.filter(art => 
            art.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
    }, [searchTerm]);

    // List Management
    const addToRestorationList = (artefact) => {
        const existingItem = restorationList.find(item => item.artefact.name === artefact.name);
        if (existingItem) {
            setRestorationList(restorationList.map(item => 
                item.artefact.name === artefact.name 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setRestorationList([...restorationList, { artefact, quantity: 1 }]);
        }
        setSearchTerm('');
    };

    const updateQuantity = (name, newQty) => {
        const qty = parseInt(newQty);
        if (isNaN(qty) || qty < 1) return;
        
        setRestorationList(restorationList.map(item => 
            item.artefact.name === name ? { ...item, quantity: qty } : item
        ));
    };

    const removeFromList = (name) => {
        setRestorationList(restorationList.filter(item => item.artefact.name !== name));
    };

    // Calculations
    const stats = useMemo(() => {
        const xpGain = restorationList.reduce((acc, item) => acc + (item.artefact.xp || 0) * item.quantity, 0);
        const newXp = currentXp + xpGain;
        const targetXpVal = getTargetXp('Archaeology', currentXp); // Use utility for target
        // Or manual calculation based on targetLevel
        const manualTargetXp = XP_TABLE[targetLevel] || 0;
        
        const remainingToTarget = Math.max(0, manualTargetXp - newXp);

        return { xpGain, newXp, remainingToTarget, manualTargetXp };
    }, [currentXp, restorationList, targetLevel]);

    const materialTotals = useMemo(() => {
        const totals = {};
        restorationList.forEach(({ artefact, quantity }) => {
            if (artefact.materials) {
                Object.entries(artefact.materials).forEach(([mat, qty]) => {
                    totals[mat] = (totals[mat] || 0) + (qty * quantity);
                });
            }
        });
        return Object.entries(totals).sort((a,b) => a[0].localeCompare(b[0]));
    }, [restorationList]);

    return (
        <div className="archaeology-calculator">
            <h2>Archaeology Material Calculator</h2>
            
            <div className="calc-layout">
                {/* 1. Inputs (Search & Config) */}
                <div className="calc-inputs">
                    <h3>Configuration</h3>
                    <div className="input-group">
                        <label>Current XP</label>
                        <input 
                            type="number" 
                            value={currentXp} 
                            onChange={(e) => setCurrentXp(parseInt(e.target.value) || 0)} 
                        />
                        <span className="helper-text">Level: {currentLevel}</span>
                    </div>

                     <div className="input-group">
                        <label>Target Level</label>
                        <input 
                            type="number" 
                            value={targetLevel} 
                            onChange={(e) => setTargetLevel(parseInt(e.target.value) || 120)} 
                        />
                        <span className="helper-text">Goal: {stats.manualTargetXp.toLocaleString()}</span>
                    </div>

                    <div className="input-group">
                        <label>Search Artefact</label>
                        <input 
                            type="text" 
                            placeholder="Type to search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         {searchTerm && (
                            <div className="search-results-list">
                                {filteredArtefacts.map(art => (
                                    <div key={art.name} className="search-item" onClick={() => addToRestorationList(art)}>
                                        <span>{art.name}</span>
                                        <span style={{color: '#a1887f'}}>Lvl {art.level}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Center (Restoration List) - Method equivalent */}
                <div className="calc-list">
                    <h3>Restoration Queue</h3>
                    {restorationList.length === 0 ? (
                        <p style={{color: '#8d6e63', textAlign: 'center', padding: '2rem'}}>
                            Your restoration list is empty. Add artefacts from the search panel.
                        </p>
                    ) : (
                        <table className="list-table">
                            <thead>
                                <tr>
                                    <th>Artefact</th>
                                    <th>Lvl</th>
                                    <th>Qty</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {restorationList.map(({artefact, quantity}) => (
                                    <tr key={artefact.name}>
                                        <td>{artefact.name}</td>
                                        <td>{artefact.level}</td>
                                        <td>
                                            <input 
                                                type="number" 
                                                value={quantity} 
                                                onChange={(e) => updateQuantity(artefact.name, e.target.value)}
                                                className="qty-input-small"
                                            />
                                        </td>
                                        <td style={{textAlign: 'right'}}>
                                            <button className="remove-btn" onClick={() => removeFromList(artefact.name)}>
                                                &times;
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 3. Right (Results) - Totals equivalent */}
                <div className="calc-totals">
                    <h3>Summary</h3>
                    <div className="xp-summary">
                        <div className="xp-row">
                            <span>Predicted Gain:</span>
                            <span style={{color: '#66bb6a'}}>+{stats.xpGain.toLocaleString()}</span>
                        </div>
                        <div className="xp-row">
                            <span>Projected Level:</span>
                            <span style={{color: '#d7ccc8'}}>{getLevelAtXp(stats.newXp)}</span>
                        </div>
                        <div className="xp-row">
                            <span>Remaining to {targetLevel}:</span>
                            <span style={{color: '#ef5350'}}>{stats.remainingToTarget.toLocaleString()}</span>
                        </div>
                    </div>

                    <h3>Materials Required</h3>
                    <div className="materials-list">
                        {materialTotals.length > 0 ? materialTotals.map(([name, qty]) => (
                            <div key={name} className="material-item">
                                <span className="material-name">{name}</span>
                                <span className="material-qty">{qty.toLocaleString()}</span>
                            </div>
                        )) : (
                            <p style={{color: '#8d6e63', fontStyle: 'italic', fontSize: '0.9rem'}}>No materials needed yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArchaeologyCalculator;
