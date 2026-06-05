import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { useReportCalls } from '../../../context/ReportContext';
import { WOODCUTTING_ITEMS, WOODCUTTING_BOOSTS } from '../../../data/skills/woodcuttingData';
import { URN_DATA, URN_ENHANCER_BONUS } from '../../../data/items/urnsData';
import { getXpAtLevel, getLevelAtXp } from '../../../utils/rs3';
import './WoodcuttingCalculator.css';

const WC_URNS = URN_DATA.Woodcutting;

const WoodcuttingCalculator = () => {
    const { characterData } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();

    const [currentXp, setCurrentXp] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [targetLevel, setTargetLevel] = useState(99);
    const [targetXp, setTargetXp] = useState(13034431);

    // Boosts (non-urn)
    const [activeBoosts, setActiveBoosts] = useState([]);

    // Urn controls
    const [selectedUrnIndex, setSelectedUrnIndex] = useState(-1); // -1 = no urns
    const [useEnhancer, setUseEnhancer] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [urnsAvailable, setUrnsAvailable] = useState('');

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        updateReportContext({
            tool: 'Woodcutting Calculator',
            state: { xp: currentXp, target: targetLevel, method: selectedMethod?.name, boosts: activeBoosts }
        });
        return () => clearReportContext();
    }, [currentXp, targetLevel, selectedMethod, activeBoosts]);

    useEffect(() => {
        if (characterData?.length) {
            const skill = characterData.find(s => s.name === 'Woodcutting');
            if (skill) { setCurrentXp(skill.xp); setCurrentLevel(skill.level); }
        }
    }, [characterData]);

    const handleCurrentLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setCurrentLevel(level);
        setCurrentXp(getXpAtLevel(level));
    };
    const handleCurrentXpChange = (e) => {
        const xp = parseInt(e.target.value) || 0;
        setCurrentXp(xp);
        setCurrentLevel(getLevelAtXp(xp));
    };
    const handleTargetLevelChange = (e) => {
        const level = parseInt(e.target.value) || 1;
        setTargetLevel(level);
        setTargetXp(getXpAtLevel(level));
    };
    const handleTargetXpChange = (e) => {
        const xp = parseInt(e.target.value) || 0;
        setTargetXp(xp);
        setTargetLevel(getLevelAtXp(xp));
    };

    const filteredMethods = WOODCUTTING_ITEMS
        .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.level - b.level);

    // Base XP per action from non-urn boosts
    const getBaseXpPerAction = (baseXp) => {
        let mult = 1.0;
        activeBoosts.forEach(id => {
            const b = WOODCUTTING_BOOSTS.find(b => b.id === id);
            if (b) mult += b.multiplier;
        });
        return baseXp * mult;
    };

    const remainingXp = Math.max(0, targetXp - currentXp);
    const xpPerAction = selectedMethod ? getBaseXpPerAction(selectedMethod.xp) : 0;

    // Urn math
    const selectedUrn = selectedUrnIndex >= 0 ? WC_URNS[selectedUrnIndex] : null;
    const urnBonus = selectedUrn
        ? selectedUrn.bonusXp * (useEnhancer ? 1 + URN_ENHANCER_BONUS : 1)
        : 0;
    const urnFill = selectedUrn ? selectedUrn.fillXp : 1;

    let actionsNeeded = 0;
    let urnsUsed = 0;
    let bonusXpFromUrns = 0;

    if (selectedMethod && remainingXp > 0) {
        if (!selectedUrn) {
            // No urns
            actionsNeeded = Math.ceil(remainingXp / xpPerAction);
        } else {
            const N = showAdvanced && urnsAvailable !== '' ? parseInt(urnsAvailable, 10) || 0 : Infinity;

            // Max urns that would be needed to hit goal
            const urnsForGoal = Math.floor(remainingXp / (urnFill + urnBonus));
            urnsUsed = Math.min(N, urnsForGoal);
            bonusXpFromUrns = urnsUsed * urnBonus;

            // Base XP the player must earn through actions
            const baseXpNeeded = remainingXp - bonusXpFromUrns;
            actionsNeeded = Math.ceil(baseXpNeeded / xpPerAction);
        }
    }

    const toggleBoost = (id) =>
        setActiveBoosts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    return (
        <div className="woodcutting-calculator">
            <h2>Woodcutting Calculator</h2>

            {/* Non-urn boosts */}
            <div className="modifiers">
                {WOODCUTTING_BOOSTS.map(boost => (
                    <label key={boost.id} className="checkbox-container" title={boost.description}>
                        <input
                            type="checkbox"
                            checked={activeBoosts.includes(boost.id)}
                            onChange={() => toggleBoost(boost.id)}
                        />
                        {boost.name} (+{(boost.multiplier * 100).toFixed(0)}%)
                    </label>
                ))}
            </div>

            {/* Urn controls */}
            <div className="wc-urn-row">
                <div className="wc-urn-select-group">
                    <label className="wc-urn-label">Urn</label>
                    <select
                        className="wc-urn-select"
                        value={selectedUrnIndex}
                        onChange={e => {
                            setSelectedUrnIndex(parseInt(e.target.value, 10));
                            if (parseInt(e.target.value, 10) === -1) setShowAdvanced(false);
                        }}
                    >
                        <option value={-1}>No urns</option>
                        {WC_URNS.map((urn, i) => (
                            <option key={i} value={i}>{urn.name} (Lvl {urn.level})</option>
                        ))}
                    </select>
                </div>

                {selectedUrn && (
                    <>
                        <label className="checkbox-container wc-enhancer-check" title="Urn enhancer gives +25% bonus XP per urn">
                            <input
                                type="checkbox"
                                checked={useEnhancer}
                                onChange={e => setUseEnhancer(e.target.checked)}
                            />
                            Urn Enhancer
                        </label>

                        <button
                            className={`wc-advanced-toggle ${showAdvanced ? 'active' : ''}`}
                            onClick={() => setShowAdvanced(s => !s)}
                            title="Set how many urns you have available"
                        >
                            Advanced {showAdvanced ? '▲' : '▼'}
                        </button>
                    </>
                )}
            </div>

            {showAdvanced && selectedUrn && (
                <div className="wc-advanced-panel">
                    <label>
                        Urns available
                        <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Unlimited"
                            value={urnsAvailable}
                            onChange={e => setUrnsAvailable(e.target.value)}
                        />
                    </label>
                    <span className="wc-advanced-hint">
                        Leave blank to assume unlimited urns.
                    </span>
                </div>
            )}

            <div className="calc-layout">
                {/* Left Column: Inputs */}
                <div className="calc-inputs">
                    <div className="input-row-flex">
                        <div className="input-group">
                            <label>Current Level</label>
                            <input type="number" value={currentLevel} onChange={handleCurrentLevelChange} min="1" max="120" />
                        </div>
                        <div className="input-group">
                            <label>Current XP</label>
                            <input type="number" value={currentXp} onChange={handleCurrentXpChange} />
                        </div>
                    </div>
                    <div className="input-row-flex">
                        <div className="input-group">
                            <label>Target Level</label>
                            <input type="number" value={targetLevel} onChange={handleTargetLevelChange} min="1" max="120" />
                        </div>
                        <div className="input-group">
                            <label>Target XP</label>
                            <input type="number" value={targetXp} onChange={handleTargetXpChange} />
                        </div>
                    </div>

                    {selectedMethod && (
                        <div className="selected-method-card">
                            <h3>{selectedMethod.name}</h3>
                            <p className="method-xp">
                                Base XP: {selectedMethod.xp}
                                {selectedMethod.estimated && (
                                    <span className="estimated-marker" title={selectedMethod.estimateNote}>ⓘ</span>
                                )}
                            </p>
                            <p className="method-xp-actual">Est. XP/action: {xpPerAction.toFixed(1)}</p>
                            <p className="method-level">Level: {selectedMethod.level}</p>
                            {selectedUrn && (
                                <p className="method-xp-actual">
                                    Urn: +{urnBonus.toFixed(1)} XP / {urnFill.toLocaleString()} base XP
                                    {isFinite(urnsUsed) && showAdvanced && urnsAvailable !== '' && (
                                        <> · {urnsUsed.toLocaleString()} urns used</>
                                    )}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Middle Column: Method list */}
                <div className="calc-methods">
                    <div className="methods-header">
                        <input
                            type="text"
                            placeholder="Search trees..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="methods-grid">
                        {filteredMethods.map(method => (
                            <button
                                key={method.id}
                                className={`method-btn ${selectedMethod?.id === method.id ? 'active' : ''}`}
                                onClick={() => setSelectedMethod(method)}
                            >
                                <div className="method-name">{method.name}</div>
                                <div className="method-details">
                                    <span>Lvl {method.level}</span>
                                    <span>
                                        {method.xp} XP
                                        {method.estimated && (
                                            <span
                                                className="estimated-marker"
                                                title={method.estimateNote}
                                                onClick={e => e.stopPropagation()}
                                            >ⓘ</span>
                                        )}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="calc-results">
                    <div className="result-main">
                        <div className="action-icon">🪓</div>
                        <div className="action-count">
                            <span className="number">
                                {selectedMethod ? actionsNeeded.toLocaleString() : '---'}
                            </span>
                            <span className="label">Logs Needed</span>
                        </div>
                    </div>
                    <div className="result-details">
                        <p><span>Starting Level:</span><span>{currentLevel}</span></p>
                        <p><span>Remaining XP:</span><span>{remainingXp.toLocaleString()}</span></p>
                        <p><span>Tree Type:</span><span>{selectedMethod?.name || '-'}</span></p>
                        <p><span>Base XP:</span><span>{selectedMethod?.xp || 0}</span></p>
                        {selectedUrn && bonusXpFromUrns > 0 && (
                            <p><span>Bonus XP from urns:</span><span>{Math.floor(bonusXpFromUrns).toLocaleString()}</span></p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WoodcuttingCalculator;
