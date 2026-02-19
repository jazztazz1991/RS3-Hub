import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { CRAFTING_METHODS } from '../../../data/skills/craftingData';
import { getXpAtLevel } from '../../../utils/rs3';
import './CraftingCalculator.css';

const CraftingCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();

    // Data Mapping
    const CRAFTING_ITEMS_LIST = CRAFTING_METHODS;

    // Hardcoded modifiers since data file doesn't provide them
    const TRAINING_MODIFIERS = [
        { id: 'standard', name: 'Standard', multiplier: 1.0 },
        { id: 'portable', name: 'Portable Crafter', multiplier: 1.1 }
    ];

    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(13034431);
    
    // Modifiers
    const [trainingModifier, setTrainingModifier] = useState(TRAINING_MODIFIERS[0]);
    const [filterCategory, setFilterCategory] = useState('All');

    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        updateReportContext({
            tool: 'Crafting Calculator',
            state: {
                xp: currentXp,
                target: targetLevel,
                modifier: trainingModifier?.name,
                item: selectedItem?.name,
                cat: filterCategory
            }
        });
        return () => clearReportContext();
    }, [currentXp, targetLevel, trainingModifier, selectedItem, filterCategory, updateReportContext, clearReportContext]);

    const [searchTerm, setSearchTerm] = useState('');

    // Initialize from Character Context
    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const skill = characterData.find(s => s.name === "Crafting");
            if (skill) {
                setCurrentXp(skill.xp);
                setTargetLevel(skill.level < 99 ? 99 : 120);
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

    // Filter Logic
    const categories = ['All', ...new Set(CRAFTING_ITEMS_LIST.map(i => i.category))];
    const filteredItems = CRAFTING_ITEMS_LIST.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    }).sort((a,b) => a.level - b.level); 

    // XP Calculation
    const getXpPerAction = (baseXp) => {
        return baseXp * (trainingModifier ? trainingModifier.multiplier : 1.0);
    };

    const remainingXp = Math.max(0, targetXp - currentXp);
    const xpPerAction = selectedItem ? getXpPerAction(selectedItem.xp) : 0;
    const actionsNeeded = selectedItem ? Math.ceil(remainingXp / xpPerAction) : 0;

    const handleItemSelect = (item) => {
        setSelectedItem(item);
    };

    return (
        <div className="crafting-calculator">
            <h2>Crafting Calculator</h2>

            <div className="calc-layout">
                {/* Left Column: Inputs */}
                <div className="calc-inputs">
                    <div className="input-group">
                        <label>Current XP</label>
                        <input 
                            type="number" 
                            value={currentXp} 
                            onChange={(e) => setCurrentXp(Number(e.target.value))} 
                        />
                    </div>
                    <div className="input-group">
                        <label>Target Level</label>
                        <input 
                            type="number" 
                            value={targetLevel} 
                            onChange={handleLevelChange} 
                        />
                    </div>
                     <div className="input-group">
                        <label>Target XP</label>
                        <input 
                            type="number" 
                            value={targetXp} 
                            readOnly
                            style={{opacity: 0.7}}
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Training Modifier</label>
                        <select 
                            value={trainingModifier?.id} 
                            onChange={(e) => setTrainingModifier(TRAINING_MODIFIERS.find(m => m.id === e.target.value))}
                            className="method-select"
                        >
                            {TRAINING_MODIFIERS.map(m => (
                                <option key={m.id} value={m.id}>{m.name} (x{m.multiplier})</option>
                            ))}
                        </select>
                    </div>
                    
                    {selectedItem && (
                        <div className="selected-method-card">
                            <h3>{selectedItem.name}</h3>
                            <p className="method-xp">Base XP: {selectedItem.xp}</p>
                            <p className="method-xp-actual">
                                Est. XP: {xpPerAction.toFixed(1)}
                            </p>
                            <p className="method-level">Level Req: {selectedItem.level}</p>
                        </div>
                    )}
                </div>

                {/* Middle Column: List (Items) */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <input 
                            type="text" 
                            placeholder="Search item..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         <select 
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
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
                                className={`method-btn ${selectedItem?.id === item.id ? 'active' : ''}`}
                                onClick={() => handleItemSelect(item)}
                            >
                                <div className="method-name">{item.name}</div>
                                <div className="method-details">
                                    <span>Lvl {item.level}</span>
                                    <span>{item.xp} XP</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                 {/* Right Column: Results */}
                 <div className="calc-results">
                    <div className="result-main">
                        <div className="action-icon">
                            🧵
                        </div>
                        <div className="action-count">
                            <span className="number">
                                {selectedItem 
                                    ? actionsNeeded.toLocaleString() 
                                    : '---'}
                            </span>
                            <span className="label">Items Needed</span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p>
                            <span>Remaining XP:</span>
                            <span>{remainingXp.toLocaleString()}</span>
                        </p>
                        <p>
                            <span>Item:</span>
                            <span>{selectedItem?.name || '-'}</span>
                        </p>
                        {trainingModifier && trainingModifier.multiplier !== 1 && (
                            <p className="bonus-info">
                                Modifier: x{trainingModifier.multiplier}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CraftingCalculator;
