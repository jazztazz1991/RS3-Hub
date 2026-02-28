import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { artefacts } from '../../../data/skills/artefacts';
import { XP_TABLE, getLevelAtXp, getTargetXp, getXpAtLevel } from '../../../utils/rs3';
import './ArchaeologyCalculator.css';

const MATERIAL_ZONES = {
    'Agnostic Materials': [
        'Third Age iron', 'Samite silk', 'White oak', 'Goldrune', 'Orthenglass',
        'Vellum', 'Leather scraps', 'Soapstone', 'Fossilised bone', 'Animal furs'
        
       
    ],
    'Armadylean Materials': [
         'Stormguard steel', 'Wings of War', 'Armadylean yellow',
         'Aetherium alloy', 'Quintessence'
    ],
    'Bandosian Materials': [
        'Malachite green', 'Mark of the Kyzaj', 'Vulcanised rubber', "Yu'biusk clay", 'Warforged bronze'
    ],
    'Dragonkin Materials': [
        'Dragon metal', 'Orgone', 'Compass rose','Carbon black', 'Felt'
    ],
    'Saradominist Materials': [
        'Keramos', 'White marble', 'Cobalt blue', 'Everlight silvthril', 'Star of Saradomin',
         'White candle'
    ],
    'Zamorakian Materials': [
        'Cadmium red', 'Chaotic brimstone', 'Demonhide', 'Eye of Dagon', 'Hellfire metal'
    ],
    'Zarosian Materials': [
        'Zarosian insignia', 'Imperial steel', 'Ancient vis', 'Blood of Orcus', 'Tyrian purple'
    ],
    'Other Items': []
};

const getZone = (materialName) => {
    for (const [zone, mats] of Object.entries(MATERIAL_ZONES)) {
        if (zone === 'Other Items') continue;
        if (mats.includes(materialName)) return zone;
    }
    return 'Other Items';
};

const loadSavedState = () => {
    try {
        const saved = localStorage.getItem('arch-calculator-state');
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
};

const ArchaeologyCalculator = () => {
    const { characterData, selectedCharacter, selectedCharId, updateArchMaterialBank } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();

    // State
    const [currentXp, setCurrentXp] = useState(() => {
        const s = loadSavedState();
        return s?.currentXp ?? 0;
    });
    const [targetLevel, setTargetLevel] = useState(() => {
        const s = loadSavedState();
        return s?.targetLevel ?? 99;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [restorationList, setRestorationList] = useState(() => {
        const s = loadSavedState();
        if (!s?.restorationList?.length) return [];
        return s.restorationList.reduce((acc, { artefactName, quantity }) => {
            const artefact = artefacts.find(a => a.name === artefactName);
            if (artefact) acc.push({ artefact, quantity });
            return acc;
        }, []);
    });
    const [materialStorage, setMaterialStorage] = useState(() => {
        try {
            const saved = localStorage.getItem('arch-material-storage');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });
    const [viewMode, setViewMode] = useState('calculator');
    const [bankSearch, setBankSearch] = useState('');
    const [collapsedZones, setCollapsedZones] = useState({});

    // Initialize
    useEffect(() => {
        updateReportContext({
            tool: 'Archaeology Calculator',
            state: {
                xp: currentXp,
                target: targetLevel,
                search: searchTerm,
                restoring: restorationList.length
            }
        });
        return () => clearReportContext();
    }, [currentXp, targetLevel, searchTerm, restorationList, updateReportContext, clearReportContext]);

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

    // Load bank from DB when selected character changes
    useEffect(() => {
        if (selectedCharacter?.arch_material_bank) {
            try {
                setMaterialStorage(JSON.parse(selectedCharacter.arch_material_bank));
            } catch { setMaterialStorage({}); }
        }
    }, [selectedCharId]);

    // Save bank: debounced to DB if character selected, immediate localStorage otherwise
    const saveBankTimer = useRef(null);
    useEffect(() => {
        if (selectedCharId) {
            clearTimeout(saveBankTimer.current);
            saveBankTimer.current = setTimeout(() => {
                updateArchMaterialBank(selectedCharId, materialStorage);
            }, 800);
        } else {
            localStorage.setItem('arch-material-storage', JSON.stringify(materialStorage));
        }
        return () => clearTimeout(saveBankTimer.current);
    }, [materialStorage]);

    useEffect(() => {
        const toSave = {
            currentXp,
            targetLevel,
            restorationList: restorationList.map(({ artefact, quantity }) => ({
                artefactName: artefact.name,
                quantity
            }))
        };
        localStorage.setItem('arch-calculator-state', JSON.stringify(toSave));
    }, [currentXp, targetLevel, restorationList]);

    const setStorageQty = (name, value) => {
        const qty = parseInt(value);
        setMaterialStorage(prev => ({
            ...prev,
            [name]: isNaN(qty) || qty < 0 ? 0 : qty
        }));
    };

    const clearStorage = () => setMaterialStorage({});

    const markRepaired = (artefactName) => {
        const item = restorationList.find(i => i.artefact.name === artefactName);
        if (!item) return;

        if (item.artefact.materials) {
            setMaterialStorage(prev => {
                const updated = { ...prev };
                Object.entries(item.artefact.materials).forEach(([mat, qty]) => {
                    updated[mat] = Math.max(0, (updated[mat] || 0) - qty);
                });
                return updated;
            });
        }

        setCurrentXp(prev => prev + (item.artefact.xp || 0));

        if (item.quantity <= 1) {
            setRestorationList(prev => prev.filter(i => i.artefact.name !== artefactName));
        } else {
            setRestorationList(prev => prev.map(i =>
                i.artefact.name === artefactName ? { ...i, quantity: i.quantity - 1 } : i
            ));
        }
    };

    const restoreAll = () => {
        setMaterialStorage(prev => {
            const updated = { ...prev };
            restorationList.forEach(({ artefact, quantity }) => {
                if (artefact.materials) {
                    Object.entries(artefact.materials).forEach(([mat, qty]) => {
                        updated[mat] = Math.max(0, (updated[mat] || 0) - qty * quantity);
                    });
                }
            });
            return updated;
        });

        const totalXp = restorationList.reduce((acc, { artefact, quantity }) =>
            acc + (artefact.xp || 0) * quantity, 0);
        setCurrentXp(prev => prev + totalXp);

        setRestorationList([]);
    };

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
        // Or manual calculation based on targetLevel
        const manualTargetXp = getXpAtLevel(targetLevel);
        
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

    const allUniqueMaterials = useMemo(() => {
        const mat = new Set();
        artefacts.forEach(a => {
            if (a.materials) Object.keys(a.materials).forEach(m => mat.add(m));
        });
        return [...mat].sort();
    }, []);

    const bankMaterials = useMemo(() => {
        const queueMats = new Set(materialTotals.map(([name]) => name));
        const storedMats = Object.keys(materialStorage).filter(name => materialStorage[name] > 0);
        return [...new Set([...queueMats, ...storedMats])].sort();
    }, [materialTotals, materialStorage]);

    const filteredBankSearch = useMemo(() => {
        if (!bankSearch.trim()) return [];
        return allUniqueMaterials
            .filter(m => m.toLowerCase().includes(bankSearch.toLowerCase()) && !bankMaterials.includes(m))
            .slice(0, 8);
    }, [bankSearch, allUniqueMaterials, bankMaterials]);

    const stockedCount = Object.values(materialStorage).filter(v => v > 0).length;

    const bankMaterialsByZone = useMemo(() => {
        const grouped = {};
        bankMaterials.forEach(name => {
            const zone = getZone(name);
            if (!grouped[zone]) grouped[zone] = [];
            grouped[zone].push(name);
        });
        const zoneOrder = Object.keys(MATERIAL_ZONES);
        return zoneOrder
            .filter(zone => grouped[zone]?.length > 0)
            .map(zone => ({ zone, materials: grouped[zone] }));
    }, [bankMaterials]);

    const toggleZone = (zone) => {
        setCollapsedZones(prev => ({ ...prev, [zone]: !prev[zone] }));
    };

    return (
        <div className="archaeology-calculator">
            <h2>Archaeology Material Calculator</h2>

            <div className="tab-navigation">
                <button
                    className={`tab-btn ${viewMode === 'calculator' ? 'active' : ''}`}
                    onClick={() => setViewMode('calculator')}
                >
                    Calculator
                </button>
                <button
                    className={`tab-btn ${viewMode === 'bank' ? 'active' : ''}`}
                    onClick={() => setViewMode('bank')}
                >
                    Material Bank
                    {stockedCount > 0 && <span className="tab-badge">{stockedCount}</span>}
                </button>
            </div>

            {viewMode === 'calculator' ? (
                <div className="calc-layout">
                    {/* 1. Inputs */}
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

                    {/* 2. Restoration Queue */}
                    <div className="calc-list">
                        <div className="queue-header">
                            <h3>Restoration Queue</h3>
                            {restorationList.length > 0 && (
                                <button className="restore-all-btn" onClick={restoreAll}>Restore All</button>
                            )}
                        </div>
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
                                            <td>
                                                <button className="repaired-btn" onClick={() => markRepaired(artefact.name)} title="Mark one as repaired">✓</button>
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

                    {/* 3. Summary */}
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

                        <div className="materials-header">
                            <h3>Materials Required</h3>
                        </div>
                        {materialTotals.length > 0 && (
                            <div className="materials-column-labels">
                                <span>Material</span>
                                <span>Need</span>
                                <span>Have</span>
                                <span>Left</span>
                            </div>
                        )}
                        <div className="materials-list">
                            {materialTotals.length > 0 ? materialTotals.map(([name, needed]) => {
                                const have = materialStorage[name] || 0;
                                const left = needed - have;
                                return (
                                    <div key={name} className={`material-item ${left <= 0 ? 'mat-sufficient' : ''}`}>
                                        <span className="material-name">{name}</span>
                                        <span className="material-need">{needed.toLocaleString()}</span>
                                        <span className="material-have-display">{have.toLocaleString()}</span>
                                        <span className={`material-left ${left <= 0 ? 'enough' : 'short'}`}>
                                            {left <= 0 ? '✓' : left.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            }) : (
                                <p style={{color: '#8d6e63', fontStyle: 'italic', fontSize: '0.9rem'}}>No materials needed yet.</p>
                            )}
                        </div>
                        {materialTotals.length > 0 && (
                            <button className="goto-bank-btn" onClick={() => setViewMode('bank')}>
                                Edit Bank →
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* ── Material Bank Tab ── */
                <div className="bank-tab">
                    <div className="bank-header">
                        <div>
                            <h3>Material Bank</h3>
                            <p className="bank-subtitle">
                                {selectedCharacter
                                    ? `${selectedCharacter.name}'s materials — saved to account`
                                    : 'No character selected — saved locally'}
                            </p>
                        </div>
                        {stockedCount > 0 && (
                            <button className="clear-storage-btn" onClick={clearStorage}>Clear All</button>
                        )}
                    </div>

                    <div className="bank-search-section">
                        <input
                            type="text"
                            className="bank-search-input"
                            placeholder="Add a material to track..."
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                        />
                        {filteredBankSearch.length > 0 && (
                            <div className="bank-search-results">
                                {filteredBankSearch.map(name => (
                                    <div
                                        key={name}
                                        className="bank-search-item"
                                        onClick={() => { setStorageQty(name, 1); setBankSearch(''); }}
                                    >
                                        {name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {bankMaterialsByZone.length === 0 ? (
                        <p className="bank-empty">
                            No materials tracked yet. Add artefacts to your queue or search above to add materials.
                        </p>
                    ) : (
                        <div className="bank-zones">
                            {bankMaterialsByZone.map(({ zone, materials }) => {
                                const isCollapsed = collapsedZones[zone];
                                const zoneComplete = materials.every(name => {
                                    const needed = materialTotals.find(([n]) => n === name)?.[1] || 0;
                                    return needed === 0 || (materialStorage[name] || 0) >= needed;
                                });
                                return (
                                    <div key={zone} className="bank-zone">
                                        <button
                                            className={`zone-header ${zoneComplete ? 'zone-complete' : ''}`}
                                            onClick={() => toggleZone(zone)}
                                        >
                                            <span className="zone-toggle">{isCollapsed ? '▶' : '▼'}</span>
                                            <span className="zone-name">{zone}</span>
                                            <span className="zone-count">{materials.length}</span>
                                        </button>
                                        {!isCollapsed && (
                                            <div className="bank-materials-grid">
                                                {materials.map(name => {
                                                    const have = materialStorage[name] || 0;
                                                    const needed = materialTotals.find(([n]) => n === name)?.[1] || 0;
                                                    const isNeeded = needed > 0;
                                                    const isSufficient = isNeeded && have >= needed;
                                                    const isShort = isNeeded && have < needed;

                                                    return (
                                                        <div
                                                            key={name}
                                                            className={`bank-material-card ${isSufficient ? 'sufficient' : ''} ${isShort ? 'short' : ''}`}
                                                        >
                                                            <div className="bank-mat-name">{name}</div>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="bank-mat-input"
                                                                value={have || ''}
                                                                placeholder="0"
                                                                onChange={(e) => setStorageQty(name, e.target.value)}
                                                            />
                                                            {isNeeded && (
                                                                <div className={`bank-mat-status ${isSufficient ? 'ok' : 'need'}`}>
                                                                    {isSufficient
                                                                        ? `✓ ${(have - needed).toLocaleString()} spare`
                                                                        : `Need ${(needed - have).toLocaleString()} more`}
                                                                </div>
                                                            )}
                                                            {!isNeeded && (
                                                                <div className="bank-mat-status stocked">Stocked</div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ArchaeologyCalculator;
