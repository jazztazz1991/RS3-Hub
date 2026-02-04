import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { COOKING_ITEMS, COOKING_METHODS } from '../../../data/cookingData';
import { getXpAtLevel } from '../../../utils/rs3';
import './CookingCalculator.css';

const CookingCalculator = () => {
    const { characterData } = useCharacter();

    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(13034431);
    
    // Modifiers
    const [trainingMethod, setTrainingMethod] = useState(COOKING_METHODS[0]);
    const [filterCategory, setFilterCategory] = useState('All');

    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Initialize from Character Context
    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const skill = characterData.find(s => s.name === "Cooking");
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
    const categories = ['All', ...new Set(COOKING_ITEMS.map(i => i.category))];
    const filteredMethods = COOKING_ITEMS.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    }).sort((a,b) => a.level - b.level); 

    // XP Calculation
    const getXpPerAction = (baseXp) => {
        return baseXp * (trainingMethod ? trainingMethod.multiplier : 1.0);
    };

    const remainingXp = Math.max(0, targetXp - currentXp);
    const xpPerAction = selectedItem ? getXpPerAction(selectedItem.xp) : 0;
    const actionsNeeded = selectedItem ? Math.ceil(remainingXp / xpPerAction) : 0;

    const handleItemSelect = (item) => {
        setSelectedItem(item);
    };

    return (
        <div className="cooking-calculator">
            <h2>Cooking Calculator</h2>

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
                        <label>Training Method</label>
                        <select 
                            value={trainingMethod?.id} 
                            onChange={(e) => setTrainingMethod(COOKING_METHODS.find(m => m.id === e.target.value))}
                            className="method-select"
                        >
                            {COOKING_METHODS.map(m => (
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

                {/* Middle Column: List (Methods) - WAS RIGHT, NOW MIDDLE */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <input 
                            type="text" 
                            placeholder="Search food..." 
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
                        {filteredMethods.map(item => (
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

                {/* Right Column: Results - WAS MIDDLE, NOW RIGHT */}
                <div className="calc-results">
                    <div className="result-main">
                        <div className="action-icon">
                            🍳
                        </div>
                        <div className="action-count">
                            <span className="number">
                                {selectedItem 
                                    ? actionsNeeded.toLocaleString() 
                                    : '---'}
                            </span>
                            <span className="label">Cooks Needed</span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p>
                            <span>Remaining XP:</span>
                            <span>{remainingXp.toLocaleString()}</span>
                        </p>
                        <p>
                            <span>Food:</span>
                            <span>{selectedItem?.name || '-'}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookingCalculator;
