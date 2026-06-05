import React, { useState, useEffect, useMemo } from 'react';
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
            actionsNeeded = Math.ceil(remainingXp / xpPerAction);
        } else {
            const N = showAdvanced && urnsAvailable !== '' ? parseInt(urnsAvailable, 10) || 0 : Infinity;
            const urnsForGoal = Math.floor(remainingXp / (urnFill + urnBonus));
            urnsUsed = Math.min(N, urnsForGoal);
            bonusXpFromUrns = urnsUsed * urnBonus;
            const baseXpNeeded = remainingXp - bonusXpFromUrns;
            actionsNeeded = Math.ceil(baseXpNeeded / xpPerAction);
        }
    }

    // XP tier breakdown — for methods where XP per log changes by level
    const tierBreakdown = useMemo(() => {
        if (!selectedMethod?.xpTiers || remainingXp <= 0) return null;

        const segments = [];
        let prevXp = getXpAtLevel(selectedMethod.level);
        let totalActions = 0;

        for (const tier of selectedMethod.xpTiers) {
            const tierEndXp = getXpAtLevel(Math.min(tier.toLevel, 110));
            const segStart = Math.max(currentXp, prevXp);
            const segEnd = Math.min(targetXp, tierEndXp);
            const segXp = Math.max(0, segEnd - segStart);

            if (segXp > 0) {
                const effectiveXp = getBaseXpPerAction(tier.xp);
                const actions = Math.ceil(segXp / effectiveXp);
                totalActions += actions;
                const fromLvl = getLevelAtXp(segStart);
                segments.push({
                    label: `Lvl ${fromLvl} → ${tier.displayToLevel}`,
                    xpNeeded: segXp,
                    xpPerLog: tier.xp,
                    actions,
                    note: tier.note,
                });
            }

            prevXp = tierEndXp;
            if (segEnd >= targetXp) break;
        }

        return segments.length > 1 ? { segments, total: totalActions } : null;
    }, [selectedMethod, currentXp, targetXp, activeBoosts]);

    const toggleBoost = (id) => {
        const boost = WOODCUTTING_BOOSTS.find(b => b.id === id);
        setActiveBoosts(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            // Deselect any other boost in the same outfitGroup
            const filtered = boost?.outfitGroup
                ? prev.filter(x => {
                    const b = WOODCUTTING_BOOSTS.find(b => b.id === x);
                    return b?.outfitGroup !== boost.outfitGroup;
                })
                : [...prev];
            return [...filtered, id];
        });
    };

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

                    {tierBreakdown && (
                        <div className="tier-breakdown">
                            <div className="tier-breakdown-title">XP rate breakdown</div>
                            {tierBreakdown.segments.map((seg, i) => (
                                <div key={i} className="tier-row">
                                    <div className="tier-label">
                                        {seg.label}
                                        {seg.note && (
                                            <span className="estimated-marker" title={seg.note}>ⓘ</span>
                                        )}
                                    </div>
                                    <div className="tier-detail">{seg.xpPerLog} XP/log</div>
                                    <div className="tier-actions">{seg.actions.toLocaleString()} logs</div>
                                </div>
                            ))}
                            <div className="tier-row tier-total">
                                <div className="tier-label">Total</div>
                                <div className="tier-detail"></div>
                                <div className="tier-actions">{tierBreakdown.total.toLocaleString()} logs</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WoodcuttingCalculator;
