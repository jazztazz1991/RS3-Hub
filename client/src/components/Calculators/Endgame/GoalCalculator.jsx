import { useMemo, useState, useEffect, useRef } from 'react';
import { useCharacter } from '../../../context/CharacterContext';
import { useAuth } from '../../../context/AuthContext';
import { parseHiscores } from '../../../utils/rs3';
import SkillIcon from '../../Common/SkillIcon';
import { DEFAULT_XP_PER_HOUR, GOAL_PRESETS, PLANNED_SKILLS, LANES, resolveSkillRate } from '../../../data/common/endgameGoals';
import './GoalCalculator.css';

function fmtNum(n) {
    if (n == null || !isFinite(n)) return '—';
    return Math.round(n).toLocaleString();
}

function fmtHours(h) {
    if (h == null || !isFinite(h) || h < 0) return '—';
    if (h < 1) return `${Math.round(h * 60)}m`;
    if (h < 24) return `${h.toFixed(1)}h`;
    const days = h / 24;
    if (days < 30) return `${days.toFixed(1)} days`;
    if (days < 365) return `${(days / 30.4).toFixed(1)} months`;
    return `${(days / 365).toFixed(2)} years`;
}

function fmtDate(daysFromNow) {
    if (!isFinite(daysFromNow) || daysFromNow < 0) return '—';
    const d = new Date();
    d.setDate(d.getDate() + Math.ceil(daysFromNow));
    return d.toLocaleDateString();
}

function targetXpFor(preset, skillName) {
    if (preset.targetXpAll != null) return preset.targetXpAll;
    if (preset.targetXpPerSkill?.[skillName] != null) return preset.targetXpPerSkill[skillName];
    return preset.defaultTargetXp ?? 13034431;
}

function loadPrefs(lsKey) {
    if (!lsKey) return {};
    try { return JSON.parse(localStorage.getItem(lsKey) || '{}'); }
    catch { return {}; }
}

export default function GoalCalculator() {
    const { characterData, selectedCharacter } = useCharacter();
    const { user } = useAuth();

    // localStorage key — only set when logged in
    const lsKey = user ? `rs3hub_endgame_${user.id}` : null;
    const prefs = useRef(loadPrefs(lsKey)).current;

    const [presetId, setPresetId] = useState(prefs.presetId ?? 'max');
    const [hoursPerDay, setHoursPerDay] = useState(prefs.hoursPerDay ?? 4);
    const [lane, setLane] = useState(prefs.lane ?? 'standard');
    const [rateOverrides, setRateOverrides] = useState(prefs.rateOverrides ?? {});
    const [showOverrides, setShowOverrides] = useState(false);

    // RSN lookup state (used when no character is linked)
    const [rsnInput, setRsnInput] = useState('');
    const [rsnData, setRsnData] = useState(null);
    const [rsnName, setRsnName] = useState('');
    const [rsnLoading, setRsnLoading] = useState(false);
    const [rsnError, setRsnError] = useState('');

    // Persist prefs to localStorage whenever they change (logged-in users only)
    useEffect(() => {
        if (!lsKey) return;
        try {
            localStorage.setItem(lsKey, JSON.stringify({ presetId, hoursPerDay, lane, rateOverrides }));
        } catch {}
    }, [presetId, hoursPerDay, lane, rateOverrides, lsKey]);

    async function fetchRsn(e) {
        e.preventDefault();
        const rsn = rsnInput.trim();
        if (!rsn) return;
        setRsnLoading(true);
        setRsnError('');
        setRsnData(null);
        try {
            const res = await fetch(`/api/hiscores/${encodeURIComponent(rsn)}`);
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Player not found on hiscores');
            }
            const csv = await res.text();
            const parsed = parseHiscores(csv);
            setRsnData(parsed);
            setRsnName(rsn);
        } catch (err) {
            setRsnError(err.message);
        } finally {
            setRsnLoading(false);
        }
    }

    // Character data takes priority; fall back to manually-looked-up RSN data
    const effectiveData = characterData?.length ? characterData : rsnData;
    const effectiveName = selectedCharacter?.name ?? (rsnData ? rsnName : null);

    const preset = GOAL_PRESETS.find(p => p.id === presetId) || GOAL_PRESETS[0];

    const rows = useMemo(() => {
        const xpBy = new Map();
        for (const s of effectiveData || []) xpBy.set(s.name, s.xp || 0);

        const data = PLANNED_SKILLS.map(skill => {
            const current = xpBy.get(skill) || 0;
            const target = targetXpFor(preset, skill);
            const gap = Math.max(0, target - current);
            const resolved = resolveSkillRate(skill, lane);
            const rate = Number(rateOverrides[skill]) > 0
                ? Number(rateOverrides[skill])
                : resolved.rate;
            const hours = rate > 0 ? gap / rate : 0;
            return {
                skill, current, target, gap, rate, hours,
                complete: gap === 0,
                method: resolved.method,
                source: resolved.source,
                notes: resolved.notes,
                laneUsed: resolved.laneUsed,
                isFallback: resolved.fallback,
            };
        });
        return data.sort((a, b) => b.hours - a.hours);
    }, [effectiveData, preset, rateOverrides, lane]);

    const totals = useMemo(() => {
        const totalGap = rows.reduce((s, r) => s + r.gap, 0);
        const totalHours = rows.reduce((s, r) => s + r.hours, 0);
        const completedCount = rows.filter(r => r.complete).length;
        const days = hoursPerDay > 0 ? totalHours / hoursPerDay : 0;
        return { totalGap, totalHours, completedCount, days };
    }, [rows, hoursPerDay]);

    const maxHours = Math.max(1, ...rows.map(r => r.hours));

    // Show RSN input when there's no usable data yet
    if (!effectiveData) {
        return (
            <div className="goal-calc">
                <div className="goal-header">
                    <h2>Endgame Goal Calculator</h2>
                </div>
                <form className="goal-rsn-form" onSubmit={fetchRsn}>
                    <label className="goal-label">Enter a RuneScape username to get started</label>
                    <div className="goal-rsn-row">
                        <input
                            className="goal-rsn-input"
                            type="text"
                            placeholder="e.g. Zezima"
                            value={rsnInput}
                            onChange={e => setRsnInput(e.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <button className="goal-rsn-btn" type="submit" disabled={rsnLoading || !rsnInput.trim()}>
                            {rsnLoading ? 'Looking up…' : 'Load stats'}
                        </button>
                    </div>
                    {rsnError && <p className="goal-rsn-error">{rsnError}</p>}
                    {!user && (
                        <p className="goal-rsn-hint">
                            <a href="/register">Create an account</a> to link your character and save your settings.
                        </p>
                    )}
                </form>
            </div>
        );
    }

    return (
        <div className="goal-calc">
            <div className="goal-header">
                <h2>Endgame Goal Calculator</h2>
                <div className="goal-header-right">
                    <span className="goal-char">{effectiveName}</span>
                    {!selectedCharacter && (
                        <button
                            className="goal-link-btn"
                            onClick={() => { setRsnData(null); setRsnName(''); setRsnInput(''); }}
                        >
                            Change player
                        </button>
                    )}
                </div>
            </div>

            {/* Preset chooser */}
            <div className="goal-section">
                <label className="goal-label">Goal preset</label>
                <div className="goal-presets">
                    {GOAL_PRESETS.map(p => (
                        <button
                            key={p.id}
                            className={`goal-preset ${presetId === p.id ? 'active' : ''}`}
                            onClick={() => setPresetId(p.id)}
                            title={p.description}
                        >{p.name}</button>
                    ))}
                </div>
                <p className="goal-preset-desc">{preset.description}</p>
            </div>

            {/* Hours per day + lane */}
            <div className="goal-section goal-section-inline">
                <label className="goal-label">Hours per day</label>
                <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={hoursPerDay}
                    onChange={e => setHoursPerDay(Math.max(0, Math.min(24, parseFloat(e.target.value) || 0)))}
                />

                <label className="goal-label" style={{ marginLeft: '1rem' }}>Training lane</label>
                <div className="goal-lane-toggle">
                    {LANES.map(l => (
                        <button
                            key={l.id}
                            className={lane === l.id ? 'active' : ''}
                            onClick={() => setLane(l.id)}
                            title={l.description}
                        >{l.label}</button>
                    ))}
                </div>

                <button
                    className="goal-link-btn"
                    onClick={() => setShowOverrides(s => !s)}
                >{showOverrides ? 'Hide rate overrides' : 'Customize XP/hr rates'}</button>
            </div>

            {/* Summary tiles */}
            <div className="goal-summary">
                <div>
                    <span className="goal-summary-label">Total XP remaining</span>
                    <span className="goal-summary-value">{fmtNum(totals.totalGap)}</span>
                </div>
                <div>
                    <span className="goal-summary-label">Total hours</span>
                    <span className="goal-summary-value">{fmtNum(totals.totalHours)}</span>
                </div>
                <div>
                    <span className="goal-summary-label">@ {hoursPerDay}h/day</span>
                    <span className="goal-summary-value">{fmtHours(totals.totalHours)}</span>
                </div>
                <div>
                    <span className="goal-summary-label">Est. completion</span>
                    <span className="goal-summary-value">{fmtDate(totals.days)}</span>
                </div>
                <div>
                    <span className="goal-summary-label">Skills done</span>
                    <span className="goal-summary-value">{totals.completedCount} / {rows.length}</span>
                </div>
            </div>

            {/* Bottleneck heatmap */}
            <div className="goal-section">
                <label className="goal-label">Bottleneck — sorted by time remaining</label>
                <div className="goal-bars">
                    {rows.map(r => (
                        <div key={r.skill} className={`goal-bar-row ${r.complete ? 'complete' : ''}`}>
                            <span className="goal-bar-name">
                                <SkillIcon skillName={r.skill} className="goal-bar-icon" />
                                {r.skill}
                            </span>
                            <div className="goal-bar-track">
                                <div
                                    className="goal-bar-fill"
                                    style={{ width: `${(r.hours / maxHours) * 100}%` }}
                                />
                            </div>
                            <span className="goal-bar-hours">{fmtHours(r.hours)}</span>
                            <span className="goal-bar-gap">{fmtNum(r.gap)} XP</span>
                            {showOverrides && (
                                <input
                                    type="number"
                                    min="1000"
                                    step="50000"
                                    value={rateOverrides[r.skill] ?? r.rate}
                                    onChange={e => setRateOverrides(prev => ({ ...prev, [r.skill]: e.target.value }))}
                                    className="goal-rate-input"
                                    title="Override XP/hr rate"
                                />
                            )}
                            {!showOverrides && (
                                <span className="goal-bar-rate-cell">
                                    <span className="goal-bar-rate" title={r.notes || r.method}>
                                        {(r.rate / 1000).toFixed(0)}k/hr
                                    </span>
                                    <span className="goal-bar-method">
                                        {r.source ? (
                                            <a href={r.source} target="_blank" rel="noreferrer" title={r.notes || ''}>
                                                {r.method}{r.isFallback ? ' *' : ''}
                                            </a>
                                        ) : (
                                            <span className="goal-bar-method-est" title="Not sourced — community estimate">
                                                {r.method}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
                <p className="goal-source-note">
                    Rates with a method link are sourced from the RS3 Wiki. <em>Italic</em> entries
                    are unsourced community estimates — overridable above.{' '}
                    <strong>*</strong> means we have presets for this skill but not for the lane
                    you picked, so we fell back to the closest available lane.
                </p>
            </div>
        </div>
    );
}
