import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { FARMING_CROPS, POF_ANIMALS } from '../../../data/skills/farmingData';
import { getXpAtLevel } from '../../../utils/rs3';
import './FarmingCalculator.css';

const FarmingCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();

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
        updateReportContext({
            tool: 'Farming Calculator',
            state: {
                level: currentLevel,
                target: targetLevel,
                xp: currentXp,
                mode: calcMode,
                selection: calcMode === 'crops' ? selectedCrop : selectedAnimal,
                category: calcMode === 'crops' ? cropCategory : pofCategory
            }
        });

        return () => clearReportContext();
    }, [currentLevel, targetLevel, currentXp, calcMode, selectedCrop, selectedAnimal, cropCategory, pofCategory]);

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
            
            <div className="mode-toggle" style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
                <button
                    className={`mode-btn ${calcMode === 'crops' ? 'active' : ''}`}
                    onClick={() => setCalcMode('crops')}
                    style={{
                        flex: 1, padding: '1rem', 
                        backgroundColor: calcMode === 'crops' ? '#43a047' : '#1a252f', 
                        border: '2px solid #2e7d32', color: 'white', borderRadius: '8px', cursor: 'pointer'
                    }}
                >
                    <span className="emoji">🌱</span> Crops & Trees
                </button>
                <button
                    className={`mode-btn ${calcMode === 'pof' ? 'active' : ''}`}
                    onClick={() => setCalcMode('pof')}
                    style={{
                        flex: 1, padding: '1rem', 
                        backgroundColor: calcMode === 'pof' ? '#43a047' : '#1a252f', 
                        border: '2px solid #2e7d32', color: 'white', borderRadius: '8px', cursor: 'pointer'
                    }}
                >
                    <span className="emoji">🐄</span> POF (Animals)
                </button>
            </div>

            <div className="calc-layout" style={{display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr minmax(250px, 300px)', gap: '1.5rem'}}>
                {/* 1. Stats Column */}
                <div className="calc-inputs">
                    <div className="input-group">
                        <label>Level</label>
                        <input
                            type="number"
                            value={currentLevel}
                            onChange={handleLevelChange}
                            min="1" max="120"
                            style={{width: '100%', padding: '0.8rem', backgroundColor: '#1a252f', border: '1px solid #2e7d32', borderRadius: '4px', color: 'white', marginBottom: '1rem'}}
                        />
                    </div>
                    <div className="input-group">
                        <label>Experience</label>
                        <input
                            type="number"
                            value={currentXp}
                            onChange={(e) => setCurrentXp(parseInt(e.target.value) || 0)}
                            min="0"
                            style={{width: '100%', padding: '0.8rem', backgroundColor: '#1a252f', border: '1px solid #2e7d32', borderRadius: '4px', color: 'white', marginBottom: '1rem'}}
                        />
                    </div>

                    <div className="input-group">
                        <label>Target Level</label>
                        <input
                            type="number"
                            value={targetLevel}
                            onChange={handleTargetLevelChange}
                            min="1" max="120"
                            style={{width: '100%', padding: '0.8rem', backgroundColor: '#1a252f', border: '1px solid #2e7d32', borderRadius: '4px', color: 'white', marginBottom: '1rem'}}
                        />
                    </div>
                    
                    {/* Selected Card Preview */}
                    {calcMode === 'crops' && selectedCrop && (
                        <div className="selected-method-card" style={{marginTop: '2rem', padding: '1.5rem', backgroundColor: '#1b5e20', borderRadius: '8px', border: '1px solid #2e7d32'}}>
                             <h3>{selectedCrop.name}</h3>
                             <p>Lvl {selectedCrop.level}</p>
                             <p>{selectedCrop.xp} XP</p>
                        </div>
                    )}
                     {calcMode === 'pof' && selectedAnimal && (
                        <div className="selected-method-card" style={{marginTop: '2rem', padding: '1.5rem', backgroundColor: '#1b5e20', borderRadius: '8px', border: '1px solid #2e7d32'}}>
                             <h3>{selectedAnimal.name}</h3>
                             <p>Lvl {selectedAnimal.level}</p>
                             <p>{selectedAnimal.xp} XP</p>
                        </div>
                    )}
                </div>

                {/* 2. Methods Column (Middle) - WAS RIGHT, NOW MIDDLE */}
                <div className="calc-methods">
                     {calcMode === 'crops' ? (
                        <div className="method-list">
                            <div className="methods-header" style={{marginBottom: '1rem'}}>
                                <select
                                    className="category-select"
                                    value={cropCategory}
                                    onChange={(e) => setCropCategory(e.target.value)}
                                    style={{width: '100%', padding: '0.8rem', backgroundColor: '#1a252f', border: '1px solid #2e7d32', borderRadius: '4px', color: 'white'}}
                                >
                                    {cropCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="methods-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', maxHeight: '600px', overflowY: 'auto'}}>
                                {filteredCrops.map(crop => (
                                    <button
                                        key={crop.id}
                                        className={`method-btn ${selectedCrop?.id === crop.id ? 'active' : ''}`}                                                                                                                           
                                        onClick={() => setSelectedCrop(crop)}
                                        style={{
                                            width: '100%',
                                            backgroundColor: selectedCrop?.id === crop.id ? '#1b5e20' : '#1a252f',
                                            border: '1px solid #2e7d32',
                                            padding: '0.8rem',
                                            borderRadius: '6px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            color: 'white'
                                        }}
                                    >
                                        <div className="method-name" style={{fontWeight: 'bold', color: '#a5d6a7'}}>{crop.name}</div>
                                        <div className="method-details" style={{fontSize: '0.8rem', color: '#fff'}}>
                                            <span>Lvl {crop.level}</span>
                                            <span style={{float: 'right'}}>{Math.round(crop.xp)} XP</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="method-list">
                            <div className="methods-header" style={{marginBottom: '1rem'}}>
                                <select
                                    className="category-select"
                                    value={pofCategory}
                                    onChange={(e) => setPofCategory(e.target.value)}
                                    style={{width: '100%', padding: '0.8rem', backgroundColor: '#1a252f', border: '1px solid #2e7d32', borderRadius: '4px', color: 'white'}}
                                >
                                    {pofCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="methods-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', maxHeight: '600px', overflowY: 'auto'}}>
                                {filteredAnimals.map(animal => (
                                    <button
                                        key={animal.id}
                                        className={`method-btn ${selectedAnimal?.id === animal.id ? 'active' : ''}`}                                                                                                                     
                                        onClick={() => setSelectedAnimal(animal)}
                                        style={{
                                            width: '100%',
                                            backgroundColor: selectedAnimal?.id === animal.id ? '#1b5e20' : '#1a252f',
                                            border: '1px solid #2e7d32',
                                            padding: '0.8rem',
                                            borderRadius: '6px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            color: 'white'
                                        }}
                                    >
                                        <div className="method-name" style={{fontWeight: 'bold', color: '#a5d6a7'}}>{animal.name}</div>
                                        <div className="method-details" style={{fontSize: '0.8rem', color: '#fff'}}>
                                            <span>Lvl {animal.level}</span>
                                            <span style={{float: 'right'}}>{animal.xp} XP</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Results Column (Right) - WAS MIDDLE, NOW RIGHT */}
                <div className="calc-results">
                     <div className="result-main" style={{textAlign: 'center', marginBottom: '2rem'}}>
                        {calcMode === 'crops' && selectedCrop && (
                            <>
                            <div className="action-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>🌿</div>
                            <div className="action-count">
                                <span className="number" style={{display: 'block', fontSize: '2.5rem', fontWeight: 'bold', color: '#66bb6a'}}>
                                    {Math.ceil(remainingXp / selectedCrop.xp).toLocaleString()}
                                </span>
                                <span className="label">Actions Needed</span>
                            </div>
                            </>
                        )}
                        {calcMode === 'pof' && selectedAnimal && (
                            <>
                            <div className="action-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>🐾</div>
                            <div className="action-count">
                                <span className="number" style={{display: 'block', fontSize: '2.5rem', fontWeight: 'bold', color: '#66bb6a'}}>
                                    {Math.ceil(remainingXp / selectedAnimal.xp).toLocaleString()}
                                </span>
                                <span className="label">Checks Needed</span>
                            </div>
                            </>
                        )}
                        {((calcMode === 'crops' && !selectedCrop) || (calcMode === 'pof' && !selectedAnimal)) && (
                            <p style={{color: '#aaa', marginTop: '2rem'}}>Select a method to see results</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmingCalculator;
