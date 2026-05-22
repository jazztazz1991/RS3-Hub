import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SKILL_NAMES, getLevelAtXp } from '../../utils/rs3';
import SkillIcon from '../Common/SkillIcon';
import './Groups.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const WINDOWS = [
    { value: 'day',   label: 'Last 24h' },
    { value: 'week',  label: 'Last 7d' },
    { value: 'month', label: 'Last 30d' },
    { value: 'all',   label: 'All time' },
];

function fmtGain(n) {
    if (n == null) return '—';
    if (n === 0) return '0';
    if (n >= 1_000_000) return `+${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `+${(n / 1_000).toFixed(1)}k`;
    return `+${Math.round(n).toLocaleString()}`;
}

function fmtXp(n) {
    if (n == null) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return Math.round(n).toLocaleString();
}

export default function GroupDetail({ mode = 'owner' }) {
    const { id, token } = useParams();
    const isShare = mode === 'share';
    const baseUrl = isShare ? `/api/groups/share/${token}` : `/api/groups/${id}`;
    const refreshUrl = `${baseUrl}/refresh`;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [windowSel, setWindowSel] = useState('week');
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefreshing, setAutoRefreshing] = useState(false);
    const [refreshMsg, setRefreshMsg] = useState(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE}${baseUrl}?window=${windowSel}`;
            const r = await fetch(url, { credentials: 'include' });
            if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || `Failed (${r.status})`);
            setData(await r.json());
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, token, windowSel]);

    // Auto-refresh on first arrival at a group: fires the /refresh endpoint
    // (force: false → server-side 60-min per-player dedupe protects against
    // hammering on repeat visits) and then re-loads the leaderboard.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setAutoRefreshing(true);
            try {
                const r = await fetch(`${API_BASE}${refreshUrl}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ force: false }),
                });
                if (cancelled || !r.ok) return;
                await load();
            } catch { /* best-effort */ }
            finally { if (!cancelled) setAutoRefreshing(false); }
        })();
        return () => { cancelled = true; };
        /* eslint-disable-next-line */
    }, [id, token]);

    async function refresh() {
        setRefreshing(true);
        setRefreshMsg(null);
        try {
            // Owner's refresh always forces — they're explicitly asking for
            // fresh data and we trust them with the rate. The public share-
            // link refresh ignores this and stays rate-limited by the 60-min
            // per-player dedupe (handled server-side).
            const r = await fetch(`${API_BASE}${refreshUrl}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force: !isShare }),
            });
            const j = await r.json();
            setRefreshMsg(`Refreshed ${j.refreshed}${j.failed ? ` · failed ${j.failed}` : ''}`);
            await load();
        } catch (err) {
            setRefreshMsg(`Refresh failed: ${err.message}`);
        } finally { setRefreshing(false); }
    }

    function copyShareLink() {
        const t = data?.share_token || token;
        if (!t) return;
        const url = `${window.location.origin}/groups/share/${t}`;
        navigator.clipboard.writeText(url);
        setRefreshMsg('Share link copied to clipboard.');
    }

    const players = data?.leaderboard || [];

    const lastFetched = useMemo(() => {
        const times = players
            .map(r => r.last_fetched_at && new Date(r.last_fetched_at).getTime())
            .filter(Boolean);
        if (times.length === 0) return null;
        return new Date(Math.max(...times));
    }, [players]);

    // Find each skill's top scorer in this window so we can highlight the
    // leading cell. Only marks cells with a positive gain.
    const topByskill = useMemo(() => {
        const out = {};
        for (const skill of SKILL_NAMES) {
            let bestId = null;
            let bestGain = 0;
            for (const p of players) {
                const g = p.gains?.[skill] ?? 0;
                if (g > bestGain) { bestGain = g; bestId = p.member_id; }
            }
            out[skill] = bestId;
        }
        return out;
    }, [players]);

    const hasAnyData = players.some(p => p.gains != null);

    return (
        <div className="grp-page">
            <div className="grp-header">
                <div>
                    <h2>{data?.name || (loading ? 'Loading…' : 'Group')}</h2>
                    {data?.description && <p className="grp-desc">{data.description}</p>}
                </div>
                <div className="grp-toolbar">
                    {data?.owner && (
                        <button onClick={copyShareLink}>Copy share link</button>
                    )}
                    {!isShare && <Link to="/groups" className="grp-link">← All groups</Link>}
                </div>
            </div>

            <div className="grp-controls">
                <label>
                    Window
                    <select value={windowSel} onChange={e => setWindowSel(e.target.value)}>
                        {WINDOWS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                    </select>
                </label>
                <button onClick={refresh} disabled={refreshing || autoRefreshing} className="grp-refresh">
                    {refreshing ? 'Refreshing…' : autoRefreshing ? 'Auto-refreshing…' : 'Refresh hiscores'}
                </button>
            </div>

            {lastFetched && (
                <p className="grp-foot">
                    Last hiscores refresh: {lastFetched.toLocaleString()}
                    {autoRefreshing && ' · Auto-fetch running…'}
                </p>
            )}
            {refreshMsg && <p className="grp-foot">{refreshMsg}</p>}
            {error && <div className="grp-error">Error: {error}</div>}

            {!loading && players.length === 0 && (
                <p className="grp-empty">No members in this group.</p>
            )}

            {players.length > 0 && (
                <div className="grp-board grp-pivot-wrap">
                    <table className="grp-pivot">
                        <thead>
                            <tr>
                                <th className="grp-pivot-skill-head">Skill</th>
                                {players.map(p => (
                                    <th key={p.member_id} className="grp-pivot-player-head">
                                        <div className="grp-pivot-player-name">{p.display_name}</div>
                                        {p.status === 'not_found' && (
                                            <div className="grp-pivot-bad">Not on hiscores</div>
                                        )}
                                        {p.status === 'error' && (
                                            <div className="grp-pivot-bad">Fetch error</div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                            <tr className="grp-pivot-meta-row">
                                <th className="grp-pivot-skill-head">Current Overall XP</th>
                                {players.map(p => (
                                    <th key={p.member_id} className="grp-pivot-meta">
                                        {p.current_xp?.Overall != null
                                            ? `${fmtXp(p.current_xp.Overall)} · lvl ${getLevelAtXp(p.current_xp.Overall)}`
                                            : '—'}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SKILL_NAMES.map(skill => (
                                <tr key={skill} className={skill === 'Overall' ? 'grp-pivot-overall' : ''}>
                                    <td className="grp-pivot-skill-cell">
                                        <SkillIcon skillName={skill} className="grp-skill-icon" />
                                        <span>{skill}</span>
                                    </td>
                                    {players.map(p => {
                                        const g = p.gains?.[skill];
                                        const isTop = topByskill[skill] === p.member_id && g > 0;
                                        return (
                                            <td
                                                key={p.member_id}
                                                className={`grp-pivot-cell ${g > 0 ? 'grp-gain-pos' : ''} ${isTop ? 'grp-pivot-top' : ''}`}
                                                title={p.current_xp?.[skill] != null ? `Current: ${p.current_xp[skill].toLocaleString()} XP` : ''}
                                            >
                                                {fmtGain(g)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!hasAnyData && players.length > 0 && (
                <p className="grp-foot">
                    No gain data yet — click "Refresh hiscores" to take the baseline snapshot,
                    then come back later for a comparison.
                </p>
            )}
        </div>
    );
}
