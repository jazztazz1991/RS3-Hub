import { useEffect, useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import './LootTracker.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'boss', label: 'Bosses' },
    { id: 'skilling', label: 'Skilling' },
    { id: 'misc', label: 'Misc' },
];

function fmtNum(n) {
    if (n == null || !isFinite(n)) return '—';
    return Math.round(n).toLocaleString();
}

function fmtCoins(n) {
    if (n == null || !isFinite(n) || n === 0) return '—';
    return fmtNum(n) + ' gp';
}

// Sum total GE value across a drop list (uses current ge_price_current on
// joined items; quantity × price, missing prices contribute 0).
function totalValueOf(drops) {
    return (drops || []).reduce((sum, d) => {
        const price = d.item?.ge_price_current;
        if (!price) return sum;
        return sum + price * d.quantity;
    }, 0);
}

export default function LootTracker() {
    const { selectedCharacter } = useCharacter();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    // New-activity form state
    const [showNewForm, setShowNewForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState('boss');

    const characterId = selectedCharacter?.id;

    async function load() {
        if (!characterId) { setActivities([]); return; }
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ characterId });
            if (category !== 'all') params.set('category', category);
            const res = await fetch(`${API_BASE}/api/loot?${params}`, { credentials: 'include' });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Failed (${res.status})`);
            setActivities(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [characterId, category]);

    async function createActivity(e) {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            const res = await fetch(`${API_BASE}/api/loot`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId, name: newName.trim(), category: newCategory }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Failed (${res.status})`);
            setNewName('');
            setShowNewForm(false);
            await load();
        } catch (err) {
            setError(err.message);
        }
    }

    async function patchActivity(id, body) {
        const res = await fetch(`${API_BASE}/api/loot/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Failed (${res.status})`);
        await load();
    }

    async function deleteActivity(id) {
        if (!confirm('Delete this activity and all its drops?')) return;
        await fetch(`${API_BASE}/api/loot/${id}`, { method: 'DELETE', credentials: 'include' });
        if (expandedId === id) setExpandedId(null);
        await load();
    }

    if (!characterId) {
        return (
            <div className="loot-page">
                <h2>Loot Tracker</h2>
                <p className="loot-empty">Select a character to start tracking loot.</p>
            </div>
        );
    }

    return (
        <div className="loot-page">
            <div className="loot-header">
                <h2>Loot Tracker</h2>
                <span className="loot-char">{selectedCharacter?.name}</span>
            </div>

            <div className="loot-controls">
                <div className="loot-filters">
                    {CATEGORIES.map(c => (
                        <button
                            key={c.id}
                            className={`loot-chip ${category === c.id ? 'active' : ''}`}
                            onClick={() => setCategory(c.id)}
                        >{c.label}</button>
                    ))}
                </div>
                <button
                    className="loot-primary-btn"
                    onClick={() => setShowNewForm(s => !s)}
                >{showNewForm ? 'Cancel' : '+ Add activity'}</button>
            </div>

            {showNewForm && (
                <form className="loot-new-form" onSubmit={createActivity}>
                    <input
                        autoFocus
                        placeholder="Activity name (e.g. Vorago, Yew logs)"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                    />
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                        <option value="boss">Boss</option>
                        <option value="skilling">Skilling</option>
                        <option value="misc">Misc</option>
                    </select>
                    <button type="submit" className="loot-primary-btn">Add</button>
                </form>
            )}

            {error && <div className="loot-error">{error}</div>}
            {loading && <div className="loot-status">Loading…</div>}

            <div className="loot-activities">
                {!loading && activities.length === 0 && (
                    <p className="loot-empty">No activities tracked yet. Add one above.</p>
                )}
                {activities.map(a => (
                    <ActivityCard
                        key={a.id}
                        activity={a}
                        expanded={expandedId === a.id}
                        onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                        onPatch={(body) => patchActivity(a.id, body)}
                        onDelete={() => deleteActivity(a.id)}
                        onReload={load}
                    />
                ))}
            </div>
        </div>
    );
}

function ActivityCard({ activity, expanded, onToggle, onPatch, onDelete, onReload }) {
    const totalValue = useMemo(() => totalValueOf(activity.drops), [activity.drops]);
    const dropCount = (activity.drops || []).length;
    const avgGpPerKill = activity.kill_count > 0 ? totalValue / activity.kill_count : 0;

    return (
        <div className={`loot-card ${expanded ? 'expanded' : ''}`}>
            <div className="loot-card-header" onClick={onToggle}>
                <span className={`loot-cat-badge cat-${activity.category}`}>{activity.category}</span>
                <span className="loot-card-name">{activity.name}</span>
                <div className="loot-card-stats">
                    <span><strong>{fmtNum(activity.kill_count)}</strong> kills</span>
                    <span><strong>{dropCount}</strong> drop types</span>
                    <span><strong>{fmtCoins(totalValue)}</strong></span>
                    <span className="loot-card-stat-dim">{fmtCoins(avgGpPerKill)}/kill</span>
                </div>
                <span className="loot-card-chevron">{expanded ? '▾' : '▸'}</span>
            </div>
            {expanded && (
                <ActivityDetail
                    activity={activity}
                    onPatch={onPatch}
                    onDelete={onDelete}
                    onReload={onReload}
                />
            )}
        </div>
    );
}

function ActivityDetail({ activity, onPatch, onDelete, onReload }) {
    const [killInput, setKillInput] = useState('1');
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [pickedItem, setPickedItem] = useState(null);
    const [dropQty, setDropQty] = useState('1');
    const [busy, setBusy] = useState(false);

    // Debounced item search
    useEffect(() => {
        if (search.length < 2 || pickedItem) { setSearchResults([]); return; }
        let cancelled = false;
        const t = setTimeout(() => {
            fetch(`${API_BASE}/api/items?q=${encodeURIComponent(search)}&limit=8`)
                .then(r => r.json())
                .then(d => { if (!cancelled) setSearchResults(d.results || []); })
                .catch(() => { if (!cancelled) setSearchResults([]); });
        }, 250);
        return () => { cancelled = true; clearTimeout(t); };
    }, [search, pickedItem]);

    async function addKills() {
        const n = parseInt(killInput, 10) || 0;
        if (n === 0) return;
        setBusy(true);
        try {
            await onPatch({ kill_count: (activity.kill_count || 0) + n });
            setKillInput('1');
        } finally { setBusy(false); }
    }

    async function logDrop() {
        const qty = parseInt(dropQty, 10) || 1;
        const name = pickedItem?.name || search.trim();
        if (!name) return;
        setBusy(true);
        try {
            const res = await fetch(`${API_BASE}/api/loot/${activity.id}/drops`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: pickedItem?.id || null,
                    item_name: name,
                    quantity: qty,
                }),
            });
            if (!res.ok) throw new Error(`Failed (${res.status})`);
            setSearch('');
            setPickedItem(null);
            setDropQty('1');
            await onReload();
        } finally { setBusy(false); }
    }

    async function deleteDrop(dropId) {
        if (!confirm('Remove this drop entry?')) return;
        await fetch(`${API_BASE}/api/loot/${activity.id}/drops/${dropId}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        await onReload();
    }

    const sortedDrops = useMemo(() => {
        return [...(activity.drops || [])].sort((a, b) => {
            const va = (a.item?.ge_price_current || 0) * a.quantity;
            const vb = (b.item?.ge_price_current || 0) * b.quantity;
            if (vb !== va) return vb - va;
            return a.item_name.localeCompare(b.item_name);
        });
    }, [activity.drops]);

    return (
        <div className="loot-detail">
            <div className="loot-actions">
                <div className="loot-action-group">
                    <label>Add kills</label>
                    <input
                        type="number"
                        min="1"
                        value={killInput}
                        onChange={e => setKillInput(e.target.value)}
                    />
                    <button onClick={addKills} disabled={busy}>+ Log kills</button>
                </div>
                <div className="loot-action-group loot-action-drop">
                    <label>Log drop</label>
                    {pickedItem ? (
                        <span className="loot-picked">
                            {pickedItem.image_url && <img src={pickedItem.image_url} alt="" />}
                            {pickedItem.name}
                            <button className="loot-picked-clear" onClick={() => { setPickedItem(null); setSearch(''); }}>×</button>
                        </span>
                    ) : (
                        <input
                            placeholder="Item name (or pick from list)"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    )}
                    <input
                        type="number"
                        min="1"
                        value={dropQty}
                        onChange={e => setDropQty(e.target.value)}
                        className="loot-drop-qty"
                    />
                    <button onClick={logDrop} disabled={busy || (!pickedItem && !search.trim())}>+ Log</button>
                </div>
            </div>

            {!pickedItem && searchResults.length > 0 && (
                <ul className="loot-search-results">
                    {searchResults.map(r => (
                        <li key={r.id} onClick={() => { setPickedItem(r); setSearchResults([]); }}>
                            {r.image_url && <img src={r.image_url} alt="" />}
                            <span>{r.name}</span>
                            {r.ge_price_current != null && (
                                <span className="loot-search-price">{fmtCoins(r.ge_price_current)}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <table className="loot-drops-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit price</th>
                        <th>Total value</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {sortedDrops.length === 0 && (
                        <tr><td colSpan={6} className="loot-empty-row">No drops logged yet.</td></tr>
                    )}
                    {sortedDrops.map(d => {
                        const unit = d.item?.ge_price_current;
                        const total = unit != null ? unit * d.quantity : null;
                        return (
                            <tr key={d.id}>
                                <td>{d.item?.image_url && <img src={d.item.image_url} alt="" className="loot-row-image" />}</td>
                                <td>{d.item?.slug
                                    ? <a href={`/items/${d.item.slug}`} target="_blank" rel="noreferrer">{d.item_name}</a>
                                    : d.item_name}</td>
                                <td>{fmtNum(d.quantity)}</td>
                                <td>{unit != null ? fmtCoins(unit) : '—'}</td>
                                <td>{total != null ? fmtCoins(total) : '—'}</td>
                                <td>
                                    <button className="loot-icon-btn" onClick={() => deleteDrop(d.id)} title="Delete">×</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="loot-detail-footer">
                <button className="loot-danger-btn" onClick={onDelete}>Delete activity</button>
            </div>
        </div>
    );
}
