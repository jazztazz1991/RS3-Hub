import React, { useState, useEffect, useMemo } from 'react';
import './InventionCalculator.css';
import augmentableItems from '../../../data/skills/augmentableItems.json';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
// Note: Invention uses formatted elite skill XP. For UI consistency we interpret inputs, 
// using generic curve for placeholders if needed, but here we define essential Elite milestones.
// Ideally move to rs3.js.
import { getXpAtLevel, getLevelAtXp } from '../../../utils/rs3';

const InventionCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();
    const [currentXp, setCurrentXp] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(36073511); // Elite 99
    
    // Method settings
    const [action, setAction] = useState('siphon'); // 'siphon' | 'disassemble'
    const [itemLevel, setItemLevel] = useState(12);

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
useEffect(() => {
        updateReportContext({
            tool: 'Invention Calculator',
            state: {
                level: currentLevel,
                target: targetLevel,
                action,
                itemLevel,
                method: selectedMethod?.name
            }
        });
        return () => clearReportContext();
    }, [currentLevel, targetLevel, action, itemLevel, selectedMethod, updateReportContext, clearReportContext]);

    
    // Elite Skill Curve Approximation or Hardcoded Milestones for UX
    // (Standard Utils return Standard XP, so we override for Invention context if possible, 
    // or just accept mismatch until global util update).
    // For now, we will use local helpers that default to standard but can be patched.
    const getInvXp = (lvl) => {
        // Simplified check for major milestones to prevent total confusion
        if (lvl === 99) return 36073511;
        if (lvl === 120) return 80618654;
        if (lvl === 150) return 194927409;
        return getXpAtLevel(lvl); // Fallback to standard
    };

    const getInvLevel = (xp) => {
        if (xp >= 80618654) return 120;
        if (xp >= 36073511 && xp < 37000000) return 99;
        return getLevelAtXp(xp);
    };

    // Load character data
    useEffect(() => {
        if (characterData && characterData.length > 0) {
           const skill = characterData.find(s => s.name === 'Invention');
            if (skill) {
                setCurrentXp(skill.xp);
                setCurrentLevel(skill.level);
                // Default target
                setTargetLevel(skill.level < 99 ? 99 : 120);
                setTargetXp(skill.level < 99 ? 36073511 : 80618654);
            }
        }
    }, [characterData]);

    const handleCurrentLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setCurrentLevel(level);
        setCurrentXp(getInvXp(level));
    };

    const handleCurrentXpChange = (e) => {
        const xp = parseInt(e.target.value) || 0;
        setCurrentXp(xp);
        setCurrentLevel(getInvLevel(xp));
    };

    const handleTargetLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setTargetLevel(level);
        setTargetXp(getInvXp(level));
    };

    const handleTargetXpChange = (e) => {
        const xp = parseInt(e.target.value) || 0;
        setTargetXp(xp);
        setTargetLevel(getInvLevel(xp));
    };

    // Tier 80 Base XP Values
    const BASE_XP_TABLE = {
        1: { disassemble: 0, siphon: 0 },
        2: { disassemble: 9000, siphon: 0 },
        3: { disassemble: 27000, siphon: 0 },
        4: { disassemble: 54000, siphon: 9000 },
        5: { disassemble: 108000, siphon: 27000 },
        6: { disassemble: 144000, siphon: 54000 },
        7: { disassemble: 198000, siphon: 108000 },
        8: { disassemble: 270000, siphon: 144000 },
        9: { disassemble: 378000, siphon: 198000 },
        10: { disassemble: 540000, siphon: 270000 },
        11: { disassemble: 540000, siphon: 378000 },
        12: { disassemble: 540000, siphon: 540000 }
    };

    const calculateXPVal = (item, level, act) => {
        if (!item) return 0;
        const itemLevelInt = parseInt(level);
        if (isNaN(itemLevelInt) || itemLevelInt < 1) return 0;

        let baseXp = 0;
        // Cap calculation at level 10 for DA, 12 for Siphon for Base XP lookup
        // (Though technically DA at lvl 12 gives same Base as 10)
        
        if (act === 'disassemble') {
            const effectiveLvl = Math.min(itemLevelInt, 10); // Standard cap for DA XP scaling usually 10
            // Actually Base XP stops increasing at lvl 10 for DA in many tables, but lvl 12 is same.
            // Using provided table logic:
            if (itemLevelInt >= 10) baseXp = 540000;
            else if (BASE_XP_TABLE[itemLevelInt]) baseXp = BASE_XP_TABLE[itemLevelInt].disassemble;
        } else {
            // siphon
            if (itemLevelInt >= 12) baseXp = 540000;
            else if (BASE_XP_TABLE[itemLevelInt]) baseXp = BASE_XP_TABLE[itemLevelInt].siphon;
        }

        const tierMultiplier = 1 + 0.015 * (item.tier - 80);
        return Math.floor(baseXp * tierMultiplier);
    };

    // Filter Items
    const filteredMethods = augmentableItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', ...new Set(augmentableItems.map(item => item.category))];

    // Calc Results
    const remainingXp = Math.max(0, targetXp - currentXp);
    const xpPerAction = selectedMethod ? calculateXPVal(selectedMethod, itemLevel, action) : 0;
    const actionsNeeded = (selectedMethod && xpPerAction > 0) ? Math.ceil(remainingXp / xpPerAction) : 0;

    const handleMethodSelect = (method) => {
        setSelectedMethod(method);
    };

    return (
        <div className="invention-calculator">
            <h2>Invention Calculator</h2>

            <div className="calc-layout">
                {/* Left Column: Inputs & Config */}
                <div className="calc-inputs">
                    <div className="input-row-flex">
                        <div className="input-group">
                            <label>Current Level</label>
                            <input 
                                type="number" 
                                value={currentLevel} 
                                onChange={handleCurrentLevelChange} 
                                min="1" max="150"
                            />
                        </div>
                        <div className="input-group">
                            <label>Current XP</label>
                            <input 
                                type="number" 
                                value={currentXp} 
                                onChange={handleCurrentXpChange} 
                            />
                        </div>
                    </div>
                    <div className="input-row-flex">
                        <div className="input-group">
                            <label>Target Level</label>
                            <input 
                                type="number" 
                                value={targetLevel} 
                                onChange={handleTargetLevelChange}
                                min="1" max="150"
                            />
                        </div>
                        <div className="input-group">
                            <label>Target XP</label>
                            <input 
                                type="number" 
                                value={targetXp} 
                                onChange={handleTargetXpChange} 
                            />
                        </div>
                    </div>

                    {/* Method Config */}
                    <div className="input-group">
                        <label>Action</label>
                        <select 
                             value={action} 
                             onChange={(e) => setAction(e.target.value)}
                        >
                            <option value="siphon">Siphon</option>
                            <option value="disassemble">Disassemble</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Item Level</label>
                        <input 
                            type="number" 
                            min="1" 
                            max="20" 
                            value={itemLevel} 
                            onChange={(e) => setItemLevel(parseInt(e.target.value) || 1)} 
                        />
                    </div>
                    
                    {selectedMethod && (
                        <div className="selected-method-card">
                            <h3>{selectedMethod.name}</h3>
                            <p className="method-xp">Tier: {selectedMethod.tier}</p>
                            <p className="method-xp-actual">
                                XP / Action: {xpPerAction.toLocaleString()}
                            </p>
                            <p className="method-level">{action} @ Lvl {itemLevel}</p>
                        </div>
                    )}
                </div>

                {/* Middle Column: Item List */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <input 
                            type="text" 
                            placeholder="Search items..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
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
                        {filteredMethods.map(item => (
                            <button
                                key={item.id}
                                className={`method-btn ${selectedMethod?.id === item.id ? 'active' : ''}`}
                                onClick={() => handleMethodSelect(item)}
                            >
                                <div className="method-name">{item.name}</div>
                                <div className="method-details">
                                    <span>T{item.tier}</span>
                                    <span>{item.category}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="calc-results">
                    <div className="result-main">
                        <div className="action-icon">
                            💡
                        </div>
                        <div className="action-count">
                            <span className="number">
                                {selectedMethod 
                                    ? actionsNeeded.toLocaleString() 
                                    : '---'}
                            </span>
                            <span className="label">
                                {action === 'siphon' ? 'Siphons Needed' : 'Disassembles'}
                            </span>
                        </div>
                    </div>

                    <div className="result-details">
                        <p>
                            <span>Starting Level:</span>
                            <span>{currentLevel}</span>
                        </p>
                        <p>
                            <span>Remaining XP:</span>
                            <span>{remainingXp.toLocaleString()}</span>
                        </p>
                        <p>
                            <span>Method Tier:</span>
                            <span>{selectedMethod?.tier || '-'}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventionCalculator;
