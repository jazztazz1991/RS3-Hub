import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { FARMING_CROPS, POF_ANIMALS } from '../../../data/farmingData';
import { getXpAtLevel } from '../../../utils/rs3';
import './FarmingCalculator.css';

const FarmingCalculator = () => {
    const { characterData } = useCharacter();
    
    // State
    const [currentLevel, setCurrentLevel] = useState(1);
    const [currentXp, setCurrentXp] = useState(0);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(getXpAtLevel(99));
    
    // Mode Selection: 'crops' or 'pof'
    const [calcMode, setCalcMode] = useState('crops');
    
    // Selections
    const [selectedCrop, setSelectedCrop] = useState(null);
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    
    // Category Filters
    const [cropCategory, setCropCategory] = useState('All');
    const [pofCategory, setPofCategory] = useState('All');

    // Initialize from character data
    useEffect(() => {
        if (characterData && Array.isArray(characterData)) {
            const skill = characterData.find(s => s.name === "Farming");
            if (skill) {
                setCurrentLevel(skill.level);
                setCurrentXp(skill.xp);
                if (skill.level >= 99 && targetLevel === 99) {
                     setTargetLevel(120);
                     setTargetXp(getXpAtLevel(120));
                }
            }
        }
    }, [characterData]);

    const handleLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setCurrentLevel(Math.min(120, Math.max(1, level)));
        setCurrentXp(getXpAtLevel(level));
    };

    const handleTargetLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setTargetLevel(Math.min(120, Math.max(1, level)));
        setTargetXp(getXpAtLevel(level));
    };

    // Derived
    const remainingXp = Math.max(0, targetXp - currentXp);
    
    // Filter Lists
    const cropCategories = ['All', ...new Set(FARMING_CROPS.map(m => m.category))];
    const filteredCrops = FARMING_CROPS.filter(c => 
        cropCategory === 'All' || c.category === cropCategory
    ).sort((a,b) => b.level - a.level);

    const pofCategories = ['All', ...new Set(POF_ANIMALS.map(m => m.category))];
    const filteredAnimals = POF_ANIMALS.filter(a => 
        pofCategory === 'All' || a.category === pofCategory
    ).sort((a,b) => b.xp - a.xp);

    return (
        <div className="farming-calculator">
            <h2>Farming Calculator</h2>

            <div className="calc-layout">
                {/* 1. Stats Column */}
                <div className="card input-section">
                    <h3>Current Stats</h3>
                    <div className="input-group">
                        <label>Level</label>
                        <input 
                            type="number" 
                            value={currentLevel} 
                            onChange={handleLevelChange}
                            min="1" max="120"
                        />
                    </div>
                    <div className="input-group">
                        <label>Experience</label>
                        <input 
                            type="number" 
                            value={currentXp} 
                            onChange={(e) => setCurrentXp(parseInt(e.target.value) || 0)}
                            min="0"
                        />
                    </div>

                    <h3>Target</h3>
                    <div className="input-group">
                        <label>Level</label>
                        <input 
                            type="number" 
                            value={targetLevel} 
                            onChange={handleTargetLevelChange}
                            min="1" max="120"
                        />
                    </div>
                    <div className="helper-text">
                        XP needed: {remainingXp.toLocaleString()}
                    </div>
                </div>

                {/* 2. Middle Column - Dual Mode Switching */}
                <div className="card methods-section">
                    <div className="mode-toggle">
                        <button 
                            className={`mode-btn ${calcMode === 'crops' ? 'active' : ''}`}
                            onClick={() => setCalcMode('crops')}
                        >
                            <span className="emoji">🌱</span> Crops & Trees
                        </button>
                        <button 
                            className={`mode-btn ${calcMode === 'pof' ? 'active' : ''}`}
                            onClick={() => setCalcMode('pof')}
                        >
                            <span className="emoji">🐄</span> POF (Animals)
                        </button>
                    </div>

                    {calcMode === 'crops' ? (
                        <div className="method-list">
                            <div className="methods-header">
                                <h3>Select Crop</h3>
                                <select 
                                    className="category-select"
                                    value={cropCategory}
                                    onChange={(e) => setCropCategory(e.target.value)}
                                >
                                    {cropCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="methods-grid">
                                {filteredCrops.map(crop => (
                                    <div 
                                        key={crop.id}
                                        className={`method-btn ${selectedCrop?.id === crop.id ? 'active' : ''} ${crop.level > currentLevel ? 'locked' : ''}`}
                                        onClick={() => setSelectedCrop(crop)}
                                    >
                                        <div className="method-name">{crop.name}</div>
                                        <div className="method-details">
                                            <span>Lvl {crop.level}</span>
                                            <span>{Math.round(crop.xp).toLocaleString()} XP</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="method-list">
                            <div className="methods-header">
                                <h3>Select Animal (Check Health)</h3>
                                <select 
                                    className="category-select"
                                    value={pofCategory}
                                    onChange={(e) => setPofCategory(e.target.value)}
                                >
                                    {pofCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="methods-grid">
                                {filteredAnimals.map(animal => (
                                    <div 
                                        key={animal.id}
                                        className={`method-btn ${selectedAnimal?.id === animal.id ? 'active' : ''} ${animal.level > currentLevel ? 'locked' : ''}`}
                                        onClick={() => setSelectedAnimal(animal)}
                                    >
                                        <div className="method-name">{animal.name}</div>
                                        <div className="method-details">
                                            <span>Lvl {animal.level}</span>
                                            <span>{animal.xp.toLocaleString()} XP</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Results Column */}
                <div className="card results-section">
                    <h3>Results</h3>
                    
                    {calcMode === 'crops' && selectedCrop && (
                        <div className="results-content">
                            <div className="result-main">
                                <div className="action-icon">🌿</div>
                                <div className="action-count">
                                    <span className="number">
                                        {Math.ceil(remainingXp / selectedCrop.xp).toLocaleString()}
                                    </span>
                                    <span className="label">
                                        {selectedCrop.category === 'Tree' || selectedCrop.category === 'Fruit Tree' || selectedCrop.category === 'Special' 
                                            ? 'Trees/Saplings' 
                                            : 'Seeds/Patches'}
                                    </span>
                                </div>
                            </div>
                            <div className="result-details">
                                <p><span>Crop:</span> <strong>{selectedCrop.name}</strong></p>
                                <p><span>Category:</span> <strong>{selectedCrop.category}</strong></p>
                                <p><span>XP Per Action:</span> <strong>{selectedCrop.xp.toLocaleString()}</strong></p>
                            </div>
                        </div>
                    )}

                    {calcMode === 'pof' && selectedAnimal && (
                        <div className="results-content">
                            <div className="result-main">
                                <div className="action-icon">🐾</div>
                                <div className="action-count">
                                    <span className="number">
                                        {Math.ceil(remainingXp / selectedAnimal.xp).toLocaleString()}
                                    </span>
                                    <span className="label">Animals Checked</span>
                                </div>
                            </div>
                            <div className="result-details">
                                <p><span>Animal:</span> <strong>{selectedAnimal.name}</strong></p>
                                <p><span>Pen Size:</span> <strong>{selectedAnimal.category}</strong></p>
                                <p><span>XP (Elder Check):</span> <strong>{selectedAnimal.xp.toLocaleString()}</strong></p>
                            </div>
                        </div>
                    )}
                    
                    {((calcMode === 'crops' && !selectedCrop) || (calcMode === 'pof' && !selectedAnimal)) && (
                        <div className="no-selection"><p>Select a method</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FarmingCalculator;
