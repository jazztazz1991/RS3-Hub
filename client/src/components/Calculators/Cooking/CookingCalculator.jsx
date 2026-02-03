import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { COOKING_ITEMS, COOKING_METHODS } from '../../../data/cookingData';
import { XP_TABLE, getLevelAtXp, getXpAtLevel } from '../../../utils/rs3';
import './CookingCalculator.css';

const CookingCalculator = () => {
    const { characterData } = useCharacter();
    
    // State
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(XP_TABLE[99]);
    const [selectedItemId, setSelectedItemId] = useState('shark');
    const [selectedMethod, setSelectedMethod] = useState(COOKING_METHODS[1]);

    // Initialize from Character Context
    useEffect(() => {
        if (characterData && characterData.length > 0) {
            const cookingSkill = characterData.find(s => s.name === "Cooking");
            if (cookingSkill) {
                setCurrentXp(cookingSkill.xp);
                // Auto-set next milestone
                const lvl = cookingSkill.level;
                if (lvl < 99) setTargetLevel(99);
                else setTargetLevel(120); // Cap at 120 for now
            }
        }
    }, [characterData]);

    // Update Target XP when Level Changes
    useEffect(() => {
        // Use formula for dynamic levels, fallback to table if needed (though formula is superior)
        if (targetLevel >= 1 && targetLevel <= 120) {
             setTargetXp(getXpAtLevel(targetLevel));
        }
    }, [targetLevel]);

    const selectedItem = COOKING_ITEMS.find(i => i.id === selectedItemId) || COOKING_ITEMS[0];

    // Calculations
    const calculateResults = () => {
        const remaining = Math.max(0, targetXp - currentXp);
        const xpPerAction = selectedItem.xp * selectedMethod.multiplier;
        const actionsNeeded = Math.ceil(remaining / xpPerAction);

        return {
            remaining,
            xpPerAction: xpPerAction.toFixed(1), // Round to 1 decimal
            actionsNeeded,
            itemName: selectedItem.name,
            methodName: selectedMethod.name
        };
    };

    const results = calculateResults();

    return (
        <div className="cooking-calculator-container">
            <h2>Cooking Calculator</h2>
            
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

                    <div className="input-group">
                        <label>Method</label>
                        <select 
                            value={selectedMethod.id} 
                            onChange={(e) => setSelectedMethod(COOKING_METHODS.find(m => m.id === e.target.value))}
                        >
                            {COOKING_METHODS.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} (x{m.multiplier})
                                </option>
                            ))}
                        </select>
                        <p className="method-desc">{selectedMethod.description}</p>
                    </div>

                    <div className="input-group">
                        <label>Select Food</label>
                        <select 
                            value={selectedItemId} 
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            className="food-select"
                        >
                            {COOKING_ITEMS.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} (Lvl {item.level}) - {item.xp} XP
                                </option>
                            ))}
                        </select>
                         <p className="method-desc">Category: {selectedItem.category}</p>
                    </div>
                </div>

                {/* Results Section */}
                <div className="calc-panel results-panel">
                    <h3>Results</h3>
                    
                    <div className="result-row main-result">
                        <span className="label">You Need To Cook:</span>
                        <span className="value highlight">{results.actionsNeeded.toLocaleString()}</span>
                        <span className="unit">{results.itemName}s</span>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="label">XP Remaining</span>
                            <span className="value">{results.remaining.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">XP Per Item</span>
                            <span className="value">{results.xpPerAction}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Method</span>
                            <span className="value">{results.methodName}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookingCalculator;
