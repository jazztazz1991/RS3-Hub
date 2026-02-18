import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { FLETCHING_ITEMS as FLETCHING_DATA, FLETCHING_BOOSTS } from '../../../data/fletchingData';
import { XP_TABLE, getLevelAtXp, getXpAtLevel } from '../../../utils/rs3';
import './FletchingCalculator.css';

const FletchingCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();

    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(XP_TABLE[99]);
    const [selectedItemId, setSelectedItemId] = useState(FLETCHING_DATA[0]?.id || 'shortbow');
    const [categoryFilter, setCategoryFilter] = useState('All');
    
    // Initialize
    useEffect(() => {
        updateReportContext({
            tool: 'Fletching Calculator',
            state: {
                xp: currentXp,
                target: targetLevel,
                item: selectedItemId,
                cat: categoryFilter
            }
        });
        return () => clearReportContext();
    }, [currentXp, targetLevel, selectedItemId, categoryFilter, updateReportContext, clearReportContext]);

    useEffect(() => {
        if (characterData) {
            const skill = characterData.find(s => s.name === "Fletching");
            if (skill) {
                setCurrentXp(skill.xp);
                if (skill.level < 99) setTargetLevel(99);
                else if (skill.level === 99) setTargetLevel(120);
            }
        }
    }, [characterData]);

    // Target XP update
    useEffect(() => {
        setTargetXp(getXpAtLevel(targetLevel));
    }, [targetLevel]);

    const handleLevelChange = (e) => {
        const val = parseInt(e.target.value) || 1;
        setTargetLevel(Math.min(120, Math.max(1, val)));
    };

    const handleXpChange = (e) => {
        setCurrentXp(Math.max(0, parseInt(e.target.value) || 0));
    };

    // Derived State
    const currentLevel = getLevelAtXp(currentXp);
    const remainingXp = Math.max(0, targetXp - currentXp);
    const selectedItem = FLETCHING_DATA.find(i => i.id === selectedItemId) || FLETCHING_DATA[0];

    const xpPerAction = selectedItem.xp;
    const actionsNeeded = xpPerAction > 0 ? Math.ceil(remainingXp / xpPerAction) : 0;
    
    // Material Calculation
    const itemsPerAction = selectedItem.amountMade || 1;
    const totalMaterials = actionsNeeded * itemsPerAction;

    // Filter
    const categories = ['All', ...new Set(FLETCHING_DATA.map(i => i.category))];
    const filteredItems = categoryFilter === 'All' 
        ? FLETCHING_DATA 
        : FLETCHING_DATA.filter(i => i.category === categoryFilter);

    return (
        <div className="fletching-calculator">
            <h2>Fletching Calculator</h2>
            
            <div className="calc-layout">
                {/* 1. Inputs */}
                <div className="calc-inputs">
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
                        />
                        <span className="helper-text">Target XP: {targetXp.toLocaleString()}</span>
                    </div>

                    {selectedItem && (
                        <div className="selected-method-card">
                            <h3>{selectedItem.name}</h3>
                            <p style={{color: '#80deea'}}>Lvl {selectedItem.level}</p>
                            <p className="method-xp-actual">{selectedItem.xp} XP</p>
                        </div>
                    )}
                </div>

                {/* 2. Methods (Was 3) */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <h3>Select Method</h3>
                        <select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="category-select"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="methods-grid">
                        {filteredItems.map(item => (
                            <button
                                key={item.id}
                                className={`method-btn ${selectedItemId === item.id ? 'active' : ''} ${currentLevel < item.level ? 'locked' : ''}`}
                                onClick={() => setSelectedItemId(item.id)}
                            >
                                <div className="method-name">{item.name}</div>
                                <div className="method-details">
                                    <span className="level-req">Lvl {item.level}</span>
                                    <span className="xp-val">{item.xp} XP</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Results (Was 2) */}
                <div className="calc-results">
                    <h3>Results</h3>
                    <div className="result-main">
                        <div className="action-icon">🏹</div>
                        <div className="action-count">
                            <span className="number">{actionsNeeded.toLocaleString()}</span>
                            <span className="label">Actions Needed</span>
                        </div>
                    </div>
                    
                    <div className="result-details">
                         <p>
                            <span>Item:</span>
                            <strong>{selectedItem.name}</strong>
                         </p>
                         <p>
                            <span>Remaining XP:</span>
                            <strong>{remainingXp.toLocaleString()}</strong>
                         </p>
                         {itemsPerAction > 1 && (
                             <p>
                                <span>Total Materials:</span>
                                <strong>{totalMaterials.toLocaleString()}</strong>
                             </p>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FletchingCalculator;
