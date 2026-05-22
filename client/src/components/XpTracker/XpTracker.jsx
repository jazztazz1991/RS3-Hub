import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCharacter } from '../../context/CharacterContext';
import { getLevelAtXp } from '../../utils/rs3';
import SkillIcon from '../Common/SkillIcon';
import './XpTracker.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const SKILLS = [
    'Overall',
    'Attack', 'Defence', 'Strength', 'Constitution', 'Ranged', 'Prayer', 'Magic',
    'Cooking', 'Woodcutting', 'Fletching', 'Fishing', 'Firemaking', 'Crafting',
    'Smithing', 'Mining', 'Herblore', 'Agility', 'Thieving', 'Slayer',
    'Farming', 'Runecrafting', 'Hunter', 'Construction', 'Summoning',
    'Dungeoneering', 'Divination', 'Invention', 'Archaeology', 'Necromancy',
];

function fmtFull(n) {
    if (n == null || !isFinite(n)) return '—';
    return Math.round(n).toLocaleString();
}
function fmtGain(n) {
    if (n == null) return '—';
    if (n === 0) return '0';
    if (n >= 1_000_000) return `+${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `+${(n / 1_000).toFixed(1)}k`;
    return `+${Math.round(n).toLocaleString()}`;
}

const COLS = [
    { key: 'skill',     label: 'Skill',         sortable: true,  align: 'left'  },
    { key: 'level',     label: 'Level',         sortable: true,  align: 'right' },
    { key: 'xp',        label: 'Current XP',    sortable: true,  align: 'right' },
    { key: 'day',       label: 'Daily gain',    sortable: true,  align: 'right' },
    { key: 'week',      label: 'Weekly gain',   sortable: true,  align: 'right' },
    { key: 'month',     label: 'Monthly gain',  sortable: true,  align: 'right' },
];

export default function XpTracker() {
    const { selectedCharacter } = useCharacter();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snapshotting, setSnapshotting] = useState(false);
    const [trackingToggling, setTrackingToggling] = useState(false);
    const [sortBy, setSortBy] = useState({ key: 'day', dir: 'desc' });
    const [expandedSkill, setExpandedSkill] = useState(null);

    const characterId = selectedCharacter?.id;
    const trackingEnabled = !!selectedCharacter?.xp_tracking_enabled;

    async function loadDashboard() {
        if (!characterId) { setDashboard(null); return; }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/xp-tracker/${characterId}/dashboard`, { credentials: 'include' });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Failed (${res.status})`);
            setDashboard(await res.json());
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }

    useEffect(() => { loadDashboard(); setExpandedSkill(null); /* eslint-disable-next-line */ }, [characterId]);

    async function takeSnapshot() {
        if (!characterId) return;
        setSnapshotting(true);
        try {
            await fetch(`${API_BASE}/api/xp-tracker/${characterId}/snapshot`, {
                method: 'POST', credentials: 'include',
            });
            await loadDashboard();
        } finally { setSnapshotting(false); }
    }

    async function toggleTracking() {
        if (!characterId) return;
        setTrackingToggling(true);
        try {
            const res = await fetch(`${API_BASE}/api/xp-tracker/${characterId}/tracking`, {
                method: 'PATCH', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !trackingEnabled }),
            });
            if (res.ok) {
                selectedCharacter.xp_tracking_enabled = !trackingEnabled;
                await loadDashboard();
            }
        } finally { setTrackingToggling(false); }
    }

    // Build the row list — one row per skill, pulling gain values from each period's diff map (or null).
    const rows = useMemo(() => {
        if (!dashboard?.current_xp) return [];
        const dayDiff = dashboard.day?.diff || null;
        const weekDiff = dashboard.week?.diff || null;
        const monthDiff = dashboard.month?.diff || null;
        return SKILLS.map(skill => {
            const xp = dashboard.current_xp[skill] ?? 0;
            return {
                skill,
                xp,
                level: getLevelAtXp(xp),
                day: dayDiff ? (dayDiff[skill] ?? 0) : null,
                week: weekDiff ? (weekDiff[skill] ?? 0) : null,
                month: monthDiff ? (monthDiff[skill] ?? 0) : null,
            };
        });
    }, [dashboard]);

    const sortedRows = useMemo(() => {
        const arr = rows.slice();
        const { key, dir } = sortBy;
        const m = dir === 'asc' ? 1 : -1;
        arr.sort((a, b) => {
            if (key === 'skill') {
                // Overall always pinned to top; others alphabetical
                if (a.skill === 'Overall') return -1;
                if (b.skill === 'Overall') return 1;
                return a.skill.localeCompare(b.skill) * m;
            }
            const av = a[key] == null ? -Infinity : a[key];
            const bv = b[key] == null ? -Infinity : b[key];
            // For gain columns, "Overall" is the sum — keep it at top of the sort
            if (a.skill === 'Overall') return -1;
            if (b.skill === 'Overall') return 1;
            return (av - bv) * m;
        });
        return arr;
    }, [rows, sortBy]);

    function onSort(key) {
        setSortBy(prev => {
            if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
            // First click: gains/level/xp default desc, skill defaults asc
            return { key, dir: key === 'skill' ? 'asc' : 'desc' };
        });
    }

    if (!characterId) {
        return (
            <div className="xpt-page">
                <h2>XP Tracker</h2>
                <p className="xpt-empty">Select a character to view XP history.</p>
            </div>
        );
    }

    const periodFresh = {
        day: dashboard?.day?.has_enough_data,
        week: dashboard?.week?.has_enough_data,
        month: dashboard?.month?.has_enough_data,
    };

    return (
        <div className="xpt-page">
            <div className="xpt-header">
                <div>
                    <h2>XP Tracker</h2>
                    <span className="xpt-char">{selectedCharacter.name}</span>
                </div>
                <div className="xpt-actions">
                    <button onClick={takeSnapshot} disabled={snapshotting || !trackingEnabled}>
                        {snapshotting ? 'Capturing…' : 'Snapshot now'}
                    </button>
                    {trackingEnabled ? (
                        <button className="xpt-disable" onClick={toggleTracking} disabled={trackingToggling}>
                            {trackingToggling ? '…' : 'Disable tracking'}
                        </button>
                    ) : (
                        <button className="xpt-primary" onClick={toggleTracking} disabled={trackingToggling}>
                            {trackingToggling ? 'Enabling…' : 'Enable tracking'}
                        </button>
                    )}
                </div>
            </div>

            {!trackingEnabled && (
                <div className="xpt-opt-in">
                    <strong>Tracking is off for this character.</strong>
                    {' '}Enable it to start collecting daily XP snapshots from the hiscores.
                    A baseline snapshot is taken when you turn it on; the cron then runs daily at 03:00 UTC.
                </div>
            )}

            {error && <div className="xpt-error">Error: {error}</div>}

            <div className="xpt-table-wrap">
                <table className="xpt-table">
                    <thead>
                        <tr>
                            {COLS.map(c => (
                                <th
                                    key={c.key}
                                    className={`xpt-th ${c.align === 'right' ? 'xpt-th-right' : ''} ${sortBy.key === c.key ? 'xpt-th-active' : ''}`}
                                    onClick={() => c.sortable && onSort(c.key)}
                                >
                                    {c.label}
                                    {sortBy.key === c.key && (
                                        <span className="xpt-sort-arrow">{sortBy.dir === 'asc' ? '▲' : '▼'}</span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !dashboard && (
                            <tr><td colSpan={COLS.length} className="xpt-loading">Loading…</td></tr>
                        )}
                        {!loading && rows.length === 0 && (
                            <tr><td colSpan={COLS.length} className="xpt-empty-row">
                                No snapshots yet. {trackingEnabled
                                    ? 'Click "Snapshot now" to take your first one.'
                                    : 'Enable tracking above to start.'}
                            </td></tr>
                        )}
                        {sortedRows.map(r => (
                            <SkillRow
                                key={r.skill}
                                row={r}
                                expanded={expandedSkill === r.skill}
                                onToggle={() => setExpandedSkill(expandedSkill === r.skill ? null : r.skill)}
                                characterId={characterId}
                                fresh={periodFresh}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {dashboard?.latest_at && (
                <p className="xpt-foot">
                    Last snapshot: {new Date(dashboard.latest_at).toLocaleString()}
                    {!periodFresh.week && ' · Weekly gain shows once you have ~3+ days of data'}
                    {!periodFresh.month && ' · Monthly gain shows once you have ~15+ days'}
                </p>
            )}
        </div>
    );
}

function SkillRow({ row, expanded, onToggle, characterId, fresh }) {
    return (
        <>
            <tr
                className={`xpt-row ${expanded ? 'xpt-row-open' : ''} ${row.skill === 'Overall' ? 'xpt-row-overall' : ''}`}
                onClick={onToggle}
            >
                <td className="xpt-cell-skill">
                    <span className="xpt-arrow">{expanded ? '▼' : '▶'}</span>
                    <SkillIcon skillName={row.skill} className="xpt-row-icon" />
                    <span>{row.skill}</span>
                </td>
                <td className="xpt-right">{row.level}</td>
                <td className="xpt-right xpt-xp">{fmtFull(row.xp)}</td>
                <td className={`xpt-right xpt-gain ${row.day > 0 ? 'xpt-gain-pos' : ''}`}>
                    {fresh.day ? fmtGain(row.day) : '—'}
                </td>
                <td className={`xpt-right xpt-gain ${row.week > 0 ? 'xpt-gain-pos' : ''}`}>
                    {fresh.week ? fmtGain(row.week) : '—'}
                </td>
                <td className={`xpt-right xpt-gain ${row.month > 0 ? 'xpt-gain-pos' : ''}`}>
                    {fresh.month ? fmtGain(row.month) : '—'}
                </td>
            </tr>
            {expanded && (
                <tr className="xpt-detail">
                    <td colSpan={COLS.length}>
                        <SkillChart characterId={characterId} skill={row.skill} />
                    </td>
                </tr>
            )}
        </>
    );
}

function SkillChart({ characterId, skill }) {
    const [days, setDays] = useState(30);
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const params = new URLSearchParams({ skill, days: String(days) });
        fetch(`${API_BASE}/api/xp-tracker/${characterId}/history?${params}`, { credentials: 'include' })
            .then(r => r.json())
            .then(j => { if (!cancelled) setPoints(j.points || []); })
            .catch(() => { if (!cancelled) setPoints([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [characterId, skill, days]);

    const chartData = useMemo(() => points.map(p => ({
        t: new Date(p.t).getTime(),
        xp: p.xp,
    })), [points]);

    return (
        <div className="xpt-chart-box">
            <div className="xpt-chart-controls">
                <span className="xpt-chart-title">{skill} history</span>
                <label>
                    Window
                    <select value={days} onChange={e => setDays(parseInt(e.target.value, 10))}>
                        <option value={7}>7 days</option>
                        <option value={30}>30 days</option>
                        <option value={90}>90 days</option>
                        <option value={365}>1 year</option>
                    </select>
                </label>
            </div>
            {loading && <div className="xpt-empty">Loading…</div>}
            {!loading && chartData.length === 0 && (
                <div className="xpt-empty">No snapshots yet in this window.</div>
            )}
            {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="t"
                            domain={['dataMin', 'dataMax']}
                            type="number"
                            tickFormatter={ms => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            stroke="#aaa"
                        />
                        <YAxis
                            stroke="#aaa"
                            tickFormatter={n => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n}
                        />
                        <Tooltip
                            contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#e6e6e6' }}
                            labelFormatter={ms => new Date(ms).toLocaleString()}
                            formatter={(v) => [Number(v).toLocaleString() + ' XP', skill]}
                        />
                        <Line type="monotone" dataKey="xp" stroke="#6cd5d5" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
