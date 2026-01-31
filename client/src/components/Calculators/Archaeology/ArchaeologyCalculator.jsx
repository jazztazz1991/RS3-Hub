// src/components/Calculators/Archaeology/ArchaeologyCalculator.jsx
import React, { useState, useMemo } from 'react';
import { artefacts } from '../../../data/artefacts';
import { useCharacter } from '../../../context/CharacterContext';
import { getTargetXp, XP_TABLE } from '../../../utils/rs3';
import './ArchaeologyCalculator.css';

const ArchaeologyCalculator = () => {
    // Context
    const { characterData, selectedCharacter } = useCharacter();

    // State for the user's "Restoration List"
    // Structure: [ { artefact: {...}, quantity: 1, id: timestamp } ]
    const [restorationList, setRestorationList] = useState([]);
    
    // State for the search/filtering input
    const [searchTerm, setSearchTerm] = useState('');

    // Filter artefacts based on search input
    const filteredArtefacts = useMemo(() => {
        if (!searchTerm) return [];
        return artefacts.filter(art => 
            art.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10); // Limit suggestions to 10 for performance/UI
    }, [searchTerm]);

    // Add an artefact to the list
    const addToRestorationList = (artefact) => {
        const existingItem = restorationList.find(item => item.artefact.name === artefact.name);
        
        if (existingItem) {
            // If already in list, just increment quantity
            setRestorationList(restorationList.map(item => 
                item.artefact.name === artefact.name 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            // Add new item
            setRestorationList([
                ...restorationList, 
                { artefact, quantity: 1 }
            ]);
        }
        // Clear search
        setSearchTerm('');
    };

    // Remove from list
    const removeFromList = (name) => {
        setRestorationList(restorationList.filter(item => item.artefact.name !== name));
    };

    // Update quantity
    const updateQuantity = (name, newQty) => {
        const qty = parseInt(newQty);
        if (isNaN(qty) || qty < 1) return;
        
        setRestorationList(restorationList.map(item => 
            item.artefact.name === name 
                ? { ...item, quantity: qty }
                : item
        ));
    };

    // Calculate Totals
    const materialTotals = useMemo(() => {
        const totals = {};
        
        restorationList.forEach(({ artefact, quantity }) => {
            if (!artefact.materials) return;
            
            Object.entries(artefact.materials).forEach(([materialName, requiredQty]) => {
                const totalRequired = requiredQty * quantity;
                totals[materialName] = (totals[materialName] || 0) + totalRequired;
            });
        });

        // Sort alphabetically
        return Object.entries(totals).sort((a, b) => a[0].localeCompare(b[0]));
    }, [restorationList]);

    // Character XP Calculations
    const archStats = useMemo(() => {
        if (!characterData || characterData.length === 0) return null;
        const skill = characterData.find(s => s.name === 'Archaeology');
        if (!skill) return null;

        const currentXp = skill.xp;
        
        // Calculate Gain
        const xpGain = restorationList.reduce((acc, item) => {
            return acc + (item.artefact.xp || 0) * item.quantity;
        }, 0);

        const newXp = currentXp + xpGain;
        
        // Target (Generic 99 or 120)
        const targetXp = getTargetXp('Archaeology', currentXp);
        const remainingInitial = Math.max(0, targetXp - currentXp);
        const remainingAfter = Math.max(0, targetXp - newXp);

        return {
            currentXp,
            level: skill.level,
            xpGain,
            newXp,
            targetXp,
            remainingInitial,
            remainingAfter
        };
    }, [characterData, restorationList]);

    return (
        <div className="arch-calculator-container">
            <h2>Archaeology Material Calculator</h2>
            
            <div className="arch-layout">
                {/* LEFT COLUMN: Input and List */}
                <div className="arch-input-section">
                    
                    {/* Search Bar */}
                    <div className="search-box-container">
                        <label>Add Artefact:</label>
                        <input 
                            type="text" 
                            placeholder="Search artefact name..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="arch-search-input"
                        />
                        {/* Dropdown Suggestions */}
                        {searchTerm && (
                            <ul className="search-suggestions">
                                {filteredArtefacts.map((art, index) => (
                                    <li key={index} onClick={() => addToRestorationList(art)}>
                                        <span className="suggestion-name">{art.name}</span>
                                        <span className="suggestion-level">Lvl {art.level}</span>
                                    </li>
                                ))}
                                {filteredArtefacts.length === 0 && (
                                    <li className="no-results">No artefacts found</li>
                                )}
                            </ul>
                        )}
                    </div>

                    {/* Selected List */}
                    <div className="restoration-list">
                        <h3>Your Restoration List</h3>
                        {restorationList.length === 0 ? (
                            <p className="empty-msg">No artefacts added yet.</p>
                        ) : (
                            <table className="arch-table">
                                <thead>
                                    <tr>
                                        <th>Artefact</th>
                                        <th>Lvl</th>
                                        <th>Qty</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {restorationList.map(({ artefact, quantity }) => (
                                        <tr key={artefact.name}>
                                            <td>{artefact.name}</td>
                                            <td>{artefact.level}</td>
                                            <td>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    value={quantity}
                                                    onChange={(e) => updateQuantity(artefact.name, e.target.value)}
                                                    className="qty-input"
                                                />
                                            </td>
                                            <td>
                                                <button 
                                                    className="remove-btn"
                                                    onClick={() => removeFromList(artefact.name)}
                                                >
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Results */}
                <div className="arch-results-section">
                    
                    {/* XP Analysis Panel */}
                    {archStats && (
                        <div className="xp-analysis-card">
                            <h3>XP Forecast: {selectedCharacter?.name}</h3>
                            <div className="xp-stat-row">
                                <span>Current XP:</span>
                                <span>{archStats.currentXp.toLocaleString()}</span>
                            </div>
                            <div className="xp-stat-row gain">
                                <span>+ XP Gain:</span>
                                <span>{archStats.xpGain.toLocaleString()}</span>
                            </div>
                            <div className="xp-stat-divider"></div>
                            <div className="xp-stat-row total">
                                <span>Projected XP:</span>
                                <span>{archStats.newXp.toLocaleString()}</span>
                            </div>
                            <div className="xp-stat-row remaining">
                                <span>Remaining to Goal:</span>
                                <span>{archStats.remainingAfter.toLocaleString()} (was {archStats.remainingInitial.toLocaleString()})</span>
                            </div>
                        </div>
                    )}

                    <h3>Total Materials Required</h3>
                    {materialTotals.length === 0 ? (
                        <div className="empty-results">
                            <p>Add items to your list to see material costs.</p>
                        </div>
                    ) : (
                        <div className="materials-grid">
                            {materialTotals.map(([name, qty]) => (
                                <div key={name} className="material-card">
                                    <span className="mat-qty">{qty.toLocaleString()}</span>
                                    <span className="mat-name">{name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArchaeologyCalculator;
