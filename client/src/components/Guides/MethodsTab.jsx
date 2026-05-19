import { useEffect, useMemo, useState } from 'react';
import './MethodsTab.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

function fmtNum(n) {
    if (n == null || !isFinite(n)) return '—';
    return Math.round(n).toLocaleString();
}

function fmtRange(rangeObj) {
    if (!rangeObj) return '—';
    const lo = rangeObj.low ?? rangeObj.high;
    const hi = rangeObj.high ?? rangeObj.low;
    if (lo == null) return '—';
    if (lo === hi) return `${(lo / 1000).toFixed(0)}k`;
    return `${(lo / 1000).toFixed(0)}–${(hi / 1000).toFixed(0)}k`;
}

function fmtGp(n) {
    if (n == null || !isFinite(n) || n === 0) return '—';
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M gp`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}k gp`;
    return `${fmtNum(n)} gp`;
}

const ACCOUNT_TYPES = [
    { id: 'main', label: 'Main' },
    { id: 'ironman', label: 'Ironman' },
];

const LANES = [
    { id: 'all', label: 'All' },
    { id: 'afk', label: 'Low effort' },
    { id: 'standard', label: 'Standard' },
    { id: 'tryhard', label: 'Tryhard' },
];

const SCORE_RANK = { recommended: 3, ok: 2, avoid: 1 };

// Pick a single "Recommended" badge per account type: top method by score,
// then by XP/hr mid (for ironman) or gp/hr (for main).
function pickRecommendedId(methods, accountType) {
    const scoreKey = accountType === 'ironman' ? 'ironman_score' : 'main_score';
    const sortKey = accountType === 'ironman'
        ? (m) => m.xp_per_hour_mid || 0
        : (m) => m.gp_per_hour || 0;
    let best = null;
    for (const m of methods) {
        const score = SCORE_RANK[m[scoreKey]] ?? 0;
        const sortVal = sortKey(m);
        if (!best || score > best.score || (score === best.score && sortVal > best.sortVal)) {
            best = { id: m.id, score, sortVal };
        }
    }
    return best?.id;
}

export default function MethodsTab({ skill }) {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [accountType, setAccountType] = useState('main');
    const [lane, setLane] = useState('all');
    const [sortBy, setSortBy] = useState('xp');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetch(`${API_BASE}/api/training-methods?skill=${encodeURIComponent(skill)}`)
            .then(async r => {
                if (!r.ok) {
                    const d = await r.json().catch(() => ({}));
                    throw new Error(d.message || `Failed (${r.status})`);
                }
                return r.json();
            })
            .then(d => { if (!cancelled) setMethods(d.methods || []); })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [skill]);

    const filtered = useMemo(() => {
        let list = methods;
        if (lane !== 'all') list = list.filter(m => m.lane === lane);
        return list;
    }, [methods, lane]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        if (sortBy === 'xp') {
            arr.sort((a, b) => (b.xp_per_hour_mid || 0) - (a.xp_per_hour_mid || 0));
        } else if (sortBy === 'gp') {
            arr.sort((a, b) => (b.gp_per_hour || 0) - (a.gp_per_hour || 0));
        } else if (sortBy === 'level') {
            arr.sort((a, b) => a.level_required - b.level_required);
        }
        return arr;
    }, [filtered, sortBy]);

    const recommendedId = useMemo(() => pickRecommendedId(sorted, accountType), [sorted, accountType]);

    if (loading) return <div className="methods-status">Loading methods…</div>;
    if (error) return <div className="methods-error">Error: {error}</div>;
    if (!methods.length) return (
        <div className="methods-empty">No methods catalogued for {skill} yet.</div>
    );

    return (
        <div className="methods-tab">
            <div className="methods-controls">
                <div className="methods-control-group">
                    <label>Account</label>
                    {ACCOUNT_TYPES.map(a => (
                        <button
                            key={a.id}
                            className={`methods-chip ${accountType === a.id ? 'active' : ''}`}
                            onClick={() => setAccountType(a.id)}
                        >{a.label}</button>
                    ))}
                </div>
                <div className="methods-control-group">
                    <label>Lane</label>
                    {LANES.map(l => (
                        <button
                            key={l.id}
                            className={`methods-chip ${lane === l.id ? 'active' : ''}`}
                            onClick={() => setLane(l.id)}
                        >{l.label}</button>
                    ))}
                </div>
                <div className="methods-control-group">
                    <label>Sort</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="xp">XP/hr</option>
                        <option value="gp">gp/hr</option>
                        <option value="level">Level</option>
                    </select>
                </div>
            </div>

            <table className="methods-table">
                <thead>
                    <tr>
                        <th>Method</th>
                        <th>Lvl</th>
                        <th>XP/hr</th>
                        <th>gp/hr</th>
                        <th>Score</th>
                        <th>Tags</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map(m => {
                        const score = accountType === 'ironman' ? m.ironman_score : m.main_score;
                        const isRecommended = m.id === recommendedId && score === 'recommended';
                        const expanded = expandedId === m.id;
                        return (
                            <>
                                <tr
                                    key={m.id}
                                    className={`methods-row ${expanded ? 'expanded' : ''} ${isRecommended ? 'recommended' : ''}`}
                                    onClick={() => setExpandedId(expanded ? null : m.id)}
                                >
                                    <td>
                                        {isRecommended && <span className="methods-rec-badge">★ Recommended</span>}
                                        <span className="methods-name">{m.name}</span>
                                    </td>
                                    <td>{m.level_required}</td>
                                    <td>{fmtRange(m.xp_per_hour)}/hr</td>
                                    <td className={(m.gp_per_hour || 0) > 0 ? 'methods-gp-positive' : 'methods-gp-neutral'}>
                                        {fmtGp(m.gp_per_hour)}
                                    </td>
                                    <td>
                                        <span className={`methods-score score-${score || 'unknown'}`}>
                                            {score || '—'}
                                        </span>
                                    </td>
                                    <td className="methods-tags">
                                        {(m.tags || []).map(t => (
                                            <span key={t} className="methods-tag">{t}</span>
                                        ))}
                                    </td>
                                    <td className="methods-chevron">{expanded ? '▾' : '▸'}</td>
                                </tr>
                                {expanded && (
                                    <tr key={`${m.id}-detail`} className="methods-detail-row">
                                        <td colSpan={7}>
                                            {m.notes && <p className="methods-notes">{m.notes}</p>}
                                            {m.outputs?.length > 0 && (
                                                <div className="methods-outputs">
                                                    <strong>Outputs:</strong>{' '}
                                                    {m.outputs.map(o => (
                                                        <span key={o.itemSlug || o.name} className="methods-output">
                                                            {o.image_url && <img src={o.image_url} alt="" />}
                                                            {fmtNum(o.quantity_per_hour)}× {o.name}
                                                            {o.ge_price_current != null && (
                                                                <span className="methods-output-price">
                                                                    @ {fmtNum(o.ge_price_current)} gp
                                                                </span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {m.inputs?.length > 0 && (
                                                <div className="methods-outputs">
                                                    <strong>Inputs:</strong>{' '}
                                                    {m.inputs.map((i, idx) => (
                                                        <span key={`${i.name}-${idx}`} className="methods-output">
                                                            {fmtNum(i.quantity_per_hour)}× {i.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {m.prereqs?.length > 0 && (
                                                <div className="methods-prereqs">
                                                    <strong>Prereqs:</strong> {m.prereqs.join(', ')}
                                                </div>
                                            )}
                                            {m.source_url && (
                                                <div className="methods-source">
                                                    <a href={m.source_url} target="_blank" rel="noreferrer">
                                                        Source ↗
                                                    </a>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </>
                        );
                    })}
                </tbody>
            </table>

            <p className="methods-footer">
                {sorted.length} method{sorted.length === 1 ? '' : 's'} shown.
                {' '}{methods.some(m => m.is_auto_derived) ? 'Some rates derived from wiki recipe data + live GE prices.' : 'Rates are wiki-sourced; gp/hr uses live GE prices.'}
            </p>
        </div>
    );
}
