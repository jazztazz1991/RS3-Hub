import { useState, useMemo, useEffect } from 'react';
import bossData from '../../data/bossDrops.json';
import { MANUAL_BOSSES } from '../../data/bossDropsManual';
import './BossHunt.css';

// Scraped bosses (wiki rates + GE prices) + manually-curated enrage bosses.
const BOSSES = [...bossData.bosses, ...MANUAL_BOSSES];
const LS_KEY = 'rs3hub_boss_times';
const CALC_HISTORY_KEY = 'rs3hub_drop_calcs';

// ---------- drop-rate math ----------
function killsForProbability(N, p) {
    if (N <= 1) return 1;
    return Math.log(1 - p) / Math.log(1 - 1 / N);
}
function probInKills(N, k) {
    if (N <= 1) return 1;
    return 1 - Math.pow(1 - 1 / N, k);
}
function fmtHours(h) {
    if (!isFinite(h) || h <= 0) return '—';
    if (h < 1) return `${Math.round(h * 60)} min`;
    if (h < 24) return `${h.toFixed(1)} h`;
    return `${(h / 24).toFixed(1)} d (${h.toFixed(0)} h)`;
}
function fmtSeconds(s) {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}
function fmtGp(n) {
    if (n == null || !isFinite(n)) return '—';
    if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
    if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
    return Math.round(n).toLocaleString();
}

// Parse human shorthand into a gp number: "50m" → 50000000, "1.5b", "300k",
// "2t", "50,000,000", "50000000". Returns NaN on unparseable input.
function parseGp(str) {
    if (str == null) return NaN;
    const s = String(str).trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, '').replace(/gp$/, '');
    if (!s) return 0;
    const m = s.match(/^(\d*\.?\d+)([kmbt]?)$/);
    if (!m) return NaN;
    const num = parseFloat(m[1]);
    if (!isFinite(num)) return NaN;
    const mult = { '': 1, k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[m[2]];
    return Math.round(num * mult);
}

// Inverse of parseGp for re-populating the input from a stored number.
function toShorthand(n) {
    if (n == null || !isFinite(n)) return '';
    if (n >= 1e12) return `${+(n / 1e12).toFixed(3)}t`;
    if (n >= 1e9) return `${+(n / 1e9).toFixed(3)}b`;
    if (n >= 1e6) return `${+(n / 1e6).toFixed(3)}m`;
    if (n >= 1e3) return `${+(n / 1e3).toFixed(3)}k`;
    return String(n);
}

export default function BossHunt() {
    const [tab, setTab] = useState('calc');
    const [overrides, setOverrides] = useState(() => {
        try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
        catch { return {}; }
    });
    useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(overrides)); }, [overrides]);

    const secondsFor = (slug, fallback) => overrides[slug] ?? fallback;
    const setOverride = (slug, seconds) => setOverrides(prev => ({ ...prev, [slug]: seconds }));
    const clearOverride = (slug) => setOverrides(prev => { const n = { ...prev }; delete n[slug]; return n; });

    return (
        <div className="bh-page">
            <div className="bh-header">
                <div>
                    <h2>Drop rate calculator</h2>
                    <p className="bh-sub">
                        Enter a kill rate, drop rarity, and value to get the expected GP/hr and time-to-drop. Save
                        calculations to compare bosses side by side. The boss tabs use live wiki data as a starting point.
                    </p>
                </div>
            </div>

            <div className="bh-tabs">
                <button className={tab === 'calc' ? 'active' : ''} onClick={() => setTab('calc')}>Calculator</button>
                <button className={tab === 'find' ? 'active' : ''} onClick={() => setTab('find')}>Find a boss</button>
                <button className={tab === 'odds' ? 'active' : ''} onClick={() => setTab('odds')}>Session odds</button>
            </div>

            {tab === 'calc' && <CalcTab />}
            {tab === 'find' && <FindTab secondsFor={secondsFor} setOverride={setOverride} clearOverride={clearOverride} overrides={overrides} />}
            {tab === 'odds' && <OddsTab secondsFor={secondsFor} setOverride={setOverride} clearOverride={clearOverride} overrides={overrides} />}
        </div>
    );
}

/* ============================================================
   Tab 0 — Manual calculator with saved-comparison history
   ============================================================ */
function CalcTab() {
    const [name, setName] = useState('');
    const [kph, setKph] = useState(30);
    const [rarity, setRarity] = useState(512);
    const [valueInput, setValueInput] = useState('50m');
    const [history, setHistory] = useState(() => {
        try { return JSON.parse(localStorage.getItem(CALC_HISTORY_KEY)) || []; }
        catch { return []; }
    });
    useEffect(() => { localStorage.setItem(CALC_HISTORY_KEY, JSON.stringify(history)); }, [history]);

    const parsedValue = parseGp(valueInput);
    const valueInvalid = valueInput.trim() !== '' && Number.isNaN(parsedValue);
    const value = Number.isNaN(parsedValue) ? 0 : parsedValue;

    // Live results
    const safeKph = kph > 0 ? kph : 0;
    const safeN = rarity > 0 ? rarity : 1;
    const gpPerHour = safeKph > 0 ? (value / safeN) * safeKph : 0;
    const avgKills = safeN;
    const avgHours = safeKph > 0 ? safeN / safeKph : Infinity;
    const chancePerKill = 1 / safeN;

    function save() {
        const entry = {
            id: Date.now(),
            name: name.trim() || `${kph}/hr · 1/${rarity}`,
            kph, rarity, value,
            gpPerHour, avgHours,
        };
        setHistory(prev => [entry, ...prev].slice(0, 50));
    }
    function loadEntry(e) {
        setName(e.name); setKph(e.kph); setRarity(e.rarity); setValueInput(toShorthand(e.value));
    }
    function remove(id) { setHistory(prev => prev.filter(e => e.id !== id)); }
    function clearAll() { if (confirm('Clear all saved calculations?')) setHistory([]); }

    return (
        <div className="bh-calc">
            <div className="bh-calc-grid">
                <div className="bh-calc-inputs">
                    <label>
                        Label (optional)
                        <input type="text" placeholder="e.g. Telos dormant bow" value={name} onChange={e => setName(e.target.value)} />
                    </label>
                    <label>
                        Kills per hour
                        <input type="number" min="0" step="1" value={kph} onChange={e => setKph(Math.max(0, parseFloat(e.target.value) || 0))} />
                    </label>
                    <label>
                        Drop rarity — 1 in…
                        <input type="number" min="1" step="1" value={rarity} onChange={e => setRarity(Math.max(1, parseInt(e.target.value, 10) || 1))} />
                    </label>
                    <label>
                        Drop value
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="50m, 1.5b, 300k…"
                            value={valueInput}
                            onChange={e => setValueInput(e.target.value)}
                            className={valueInvalid ? 'bh-input-bad' : ''}
                        />
                        <span className="bh-calc-hint">
                            {valueInvalid ? 'Unrecognised — try 50m, 1.5b, 300k' : `= ${value.toLocaleString()} gp`}
                        </span>
                    </label>
                    <button className="bh-calc-save" onClick={save} disabled={valueInvalid}>+ Save to comparison</button>
                </div>

                <div className="bh-calc-results">
                    <div className="bh-calc-big">
                        <span className="bh-calc-big-label">GP / hour</span>
                        <span className="bh-calc-big-value">{fmtGp(gpPerHour)}</span>
                    </div>
                    <div className="bh-calc-stats">
                        <Stat label="Avg time to drop" value={fmtHours(avgHours)} />
                        <Stat label="Avg kills to drop" value={Math.round(avgKills).toLocaleString()} />
                        <Stat label="Chance per kill" value={`${(chancePerKill * 100).toFixed(3)}%`} />
                        <Stat label="Drop value" value={fmtGp(value) + ' gp'} />
                    </div>
                </div>
            </div>

            {history.length > 0 && (
                <div className="bh-calc-history">
                    <div className="bh-calc-history-head">
                        <h3>Saved comparisons</h3>
                        <button className="bh-calc-clear" onClick={clearAll}>Clear all</button>
                    </div>
                    <div className="bh-table-wrap">
                        <table className="bh-table">
                            <thead>
                                <tr>
                                    <th>Label</th>
                                    <th className="bh-right">Kills/hr</th>
                                    <th className="bh-right">Rarity</th>
                                    <th className="bh-right">Value</th>
                                    <th className="bh-right">GP / hr</th>
                                    <th className="bh-right">Avg time</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...history].sort((a, b) => b.gpPerHour - a.gpPerHour).map(e => (
                                    <tr key={e.id}>
                                        <td><button className="bh-calc-load" onClick={() => loadEntry(e)} title="Load into calculator">{e.name}</button></td>
                                        <td className="bh-right bh-mono">{e.kph}</td>
                                        <td className="bh-right bh-mono">1/{e.rarity.toLocaleString()}</td>
                                        <td className="bh-right bh-mono">{fmtGp(e.value)}</td>
                                        <td className="bh-right bh-mono bh-gp">{fmtGp(e.gpPerHour)}</td>
                                        <td className="bh-right bh-mono bh-time">{fmtHours(e.avgHours)}</td>
                                        <td className="bh-right"><button className="bh-calc-del" onClick={() => remove(e.id)} title="Remove">×</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="bh-foot">Sorted by GP/hr. Click a label to load it back into the calculator. Saved in your browser only.</p>
                </div>
            )}
        </div>
    );
}

/* ============================================================
   Tab 1 — Find a boss: one row per boss (its signature rare)
   ============================================================ */
function FindTab({ secondsFor, setOverride, clearOverride, overrides }) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('gp');

    const rows = useMemo(() => {
        return BOSSES.map(b => {
            const seconds = secondsFor(b.slug, b.defaultSeconds);
            const killsPerHour = 3600 / seconds;
            // Signature drop = most valuable rare (drops are value-sorted in the JSON).
            const sig = b.drops[0];
            const expectedHours = sig.rate / killsPerHour;
            const gpPerHour = sig.value != null ? (sig.value / sig.rate) * killsPerHour : null;
            return { boss: b, seconds, killsPerHour, sig, expectedHours, gpPerHour };
        });
    }, [secondsFor, overrides]);

    const filtered = useMemo(() => {
        let r = rows;
        if (search) {
            const s = search.toLowerCase();
            r = r.filter(x => x.boss.name.toLowerCase().includes(s) || x.sig.name.toLowerCase().includes(s));
        }
        const sorters = {
            gp: (a, b) => (b.gpPerHour ?? -1) - (a.gpPerHour ?? -1),
            time: (a, b) => a.expectedHours - b.expectedHours,
            rate: (a, b) => a.sig.rate - b.sig.rate,
            value: (a, b) => (b.sig.value ?? -1) - (a.sig.value ?? -1),
            boss: (a, b) => a.boss.name.localeCompare(b.boss.name),
        };
        return [...r].sort(sorters[sortKey] || sorters.gp);
    }, [rows, search, sortKey]);

    const Th = ({ k, children, right }) => (
        <th
            className={`bh-th ${right ? 'bh-right' : ''} ${sortKey === k ? 'bh-th-active' : ''}`}
            onClick={() => setSortKey(k)}
        >
            {children}{sortKey === k ? ' ▼' : ''}
        </th>
    );

    return (
        <>
            <div className="bh-toolbar">
                <input className="bh-search" placeholder="Search boss or drop…" value={search} onChange={e => setSearch(e.target.value)} />
                <span className="bh-meta">{filtered.length} bosses</span>
            </div>

            <div className="bh-table-wrap">
                <table className="bh-table">
                    <thead>
                        <tr>
                            <Th k="boss">Boss</Th>
                            <th>Headline rare</th>
                            <Th k="rate" right>Drop rate</Th>
                            <th className="bh-right">Time / attempt</th>
                            <th className="bh-right">Kills/hr</th>
                            <Th k="time" right>Avg time</Th>
                            <Th k="value" right>Value</Th>
                            <Th k="gp" right>GP / hr</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(({ boss, seconds, killsPerHour, sig, expectedHours, gpPerHour }) => (
                            <tr key={boss.slug}>
                                <td className="bh-boss-cell">
                                    {boss.name}
                                    {boss.estimated && <span className="bh-est" title={boss.estimateNote}>est</span>}
                                    <span className="bh-cat">{boss.category}</span>
                                </td>
                                <td>{sig.name}</td>
                                <td className="bh-right bh-mono">1/{sig.rate.toLocaleString()}</td>
                                <td className="bh-right">
                                    <TimeEditor
                                        slug={boss.slug} seconds={seconds}
                                        isDefault={overrides[boss.slug] == null}
                                        encounter={boss.encounter}
                                        onSet={setOverride} onClear={clearOverride}
                                    />
                                </td>
                                <td className="bh-right bh-mono">{killsPerHour.toFixed(1)}</td>
                                <td className="bh-right bh-mono bh-time">{fmtHours(expectedHours)}</td>
                                <td className="bh-right bh-mono">{fmtGp(sig.value)}</td>
                                <td className="bh-right bh-mono bh-gp">{fmtGp(gpPerHour)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="bh-foot">
                "Headline rare" is each boss's most valuable rare drop. "Avg time" is the expected time to one of it
                (1/rate × time per attempt) — half of players get it sooner, half later. "GP / hr" counts only that
                single rare, not the boss's full income (commons, alchs, bonus loot excluded). Use the
                <strong> Session odds</strong> tab to target a different drop or see the probability curve.
            </p>
        </>
    );
}

/* ============================================================
   Tab 2 — Session odds: pick boss + any of its drops
   ============================================================ */
function OddsTab({ secondsFor, setOverride, clearOverride, overrides }) {
    const [bossSlug, setBossSlug] = useState(BOSSES[0].slug);
    const [dropIdx, setDropIdx] = useState(0);
    const [hours, setHours] = useState(5);

    const boss = useMemo(() => BOSSES.find(b => b.slug === bossSlug) || BOSSES[0], [bossSlug]);
    const drop = boss.drops[dropIdx] || boss.drops[0];
    const seconds = secondsFor(boss.slug, boss.defaultSeconds);
    const killsPerHour = 3600 / seconds;
    const N = drop.rate;

    useEffect(() => { setDropIdx(0); }, [bossSlug]);

    const killsInSession = hours * killsPerHour;
    const pAtLeastOne = probInKills(N, killsInSession);
    const expectedDrops = killsInSession / N;
    const milestones = [0.5, 0.75, 0.9, 0.99].map(p => {
        const kills = killsForProbability(N, p);
        return { p, kills, hours: kills / killsPerHour };
    });
    const word = boss.encounter === 'clear' ? 'clears' : 'kills';

    return (
        <div className="bh-odds">
            <div className="bh-odds-controls">
                <label>
                    Boss
                    <select value={bossSlug} onChange={e => setBossSlug(e.target.value)}>
                        {BOSSES.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)}
                    </select>
                </label>
                <label>
                    Drop
                    <select value={dropIdx} onChange={e => setDropIdx(parseInt(e.target.value, 10))}>
                        {boss.drops.map((d, i) => (
                            <option key={i} value={i}>{d.name} (1/{d.rate.toLocaleString()})</option>
                        ))}
                    </select>
                </label>
                <label>
                    {boss.encounter === 'clear' ? 'Clear time' : 'Kill time'}
                    <div className="bh-time-input">
                        <MinSec seconds={seconds} onChange={(s) => setOverride(boss.slug, Math.max(1, s))} />
                        {overrides[boss.slug] != null && (
                            <button className="bh-reset" onClick={() => clearOverride(boss.slug)} title="Reset to default">↺</button>
                        )}
                    </div>
                </label>
                <label>
                    Hours this session
                    <input type="number" min="0" step="0.5" value={hours}
                        onChange={e => setHours(Math.max(0, parseFloat(e.target.value) || 0))} />
                </label>
            </div>

            {boss.estimated && (
                <div className="bh-est-banner">⚠ {boss.estimateNote || 'Drop rates for this boss are estimates, not scraped from the wiki.'}</div>
            )}

            <div className="bh-odds-grid">
                <div className="bh-odds-big">
                    <span className="bh-odds-label">Chance of {drop.name} in {hours}h</span>
                    <span className="bh-odds-value">{(pAtLeastOne * 100).toFixed(1)}%</span>
                    <span className="bh-odds-sub">{Math.round(killsInSession).toLocaleString()} {word} · {expectedDrops.toFixed(2)} expected</span>
                </div>
                <div className="bh-odds-detail">
                    <Stat label="Drop rate" value={`1 / ${N.toLocaleString()}`} />
                    <Stat label={boss.encounter === 'clear' ? 'Clears / hour' : 'Kills / hour'} value={killsPerHour.toFixed(1)} />
                    <Stat label="Avg to drop" value={fmtHours(N / killsPerHour)} />
                    <Stat label="Item value" value={drop.value != null ? fmtGp(drop.value) + ' gp' : 'Untradeable'} />
                    <Stat label="GP / hr (this drop)" value={drop.value != null ? fmtGp((drop.value / N) * killsPerHour) + ' gp' : '—'} />
                    <Stat label="Time / attempt" value={fmtSeconds(seconds)} />
                </div>
            </div>

            <h3 className="bh-milestone-head">How long for a given confidence</h3>
            <table className="bh-table bh-milestone-table">
                <thead>
                    <tr><th>Confidence</th><th className="bh-right">{boss.encounter === 'clear' ? 'Clears' : 'Kills'}</th><th className="bh-right">Time</th></tr>
                </thead>
                <tbody>
                    {milestones.map(m => (
                        <tr key={m.p}>
                            <td>{(m.p * 100).toFixed(0)}% chance you'll have it</td>
                            <td className="bh-right bh-mono">{Math.ceil(m.kills).toLocaleString()}</td>
                            <td className="bh-right bh-mono">{fmtHours(m.hours)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="bh-foot">
                Each {boss.encounter === 'clear' ? 'clear' : 'kill'} is independent — being "dry" doesn't improve your
                next roll. The 99% row is roughly the point where going without the drop is genuinely unlucky.
            </p>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="bh-stat">
            <span className="bh-stat-label">{label}</span>
            <span className="bh-stat-value">{value}</span>
        </div>
    );
}

// Min/sec editor — two small inputs. Calls onChange with total seconds.
function MinSec({ seconds, onChange, title }) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return (
        <span className="bh-minsec" title={title}>
            <input type="number" min="0" value={mins}
                onChange={e => onChange(Math.max(0, (parseInt(e.target.value, 10) || 0)) * 60 + secs)} />
            <span className="bh-time-unit">m</span>
            <input type="number" min="0" max="59" value={secs}
                onChange={e => onChange(mins * 60 + Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))} />
            <span className="bh-time-unit">s</span>
        </span>
    );
}

function TimeEditor({ slug, seconds, isDefault, encounter, onSet, onClear }) {
    return (
        <span className={`bh-time-editor ${isDefault ? '' : 'bh-time-custom'}`}>
            <MinSec
                seconds={seconds}
                onChange={(s) => onSet(slug, Math.max(1, s))}
                title={encounter === 'clear' ? 'Clear time' : 'Kill time'}
            />
            {!isDefault && <button className="bh-reset" onClick={() => onClear(slug)} title="Reset to default">↺</button>}
        </span>
    );
}
