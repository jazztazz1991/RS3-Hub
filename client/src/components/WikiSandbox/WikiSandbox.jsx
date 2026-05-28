import { useEffect, useState, useMemo } from 'react';
import './WikiSandbox.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const TABS = [
    { key: 'creatures',      label: 'Creatures',      path: 'creatures' },
    { key: 'npcs',           label: 'NPCs',           path: 'npcs' },
    { key: 'achievements',   label: 'Achievements',   path: 'achievements' },
    { key: 'locations',      label: 'Locations',      path: 'locations' },
    { key: 'resource_nodes', label: 'Resource Nodes', path: 'resource-nodes' },
    { key: 'sync_log',       label: 'Sync log',       path: 'sync-log' },
];

export default function WikiSandbox() {
    const [tab, setTab] = useState('creatures');
    const [data, setData] = useState({});
    const [loading, setLoading] = useState({});
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState(null);

    async function load(tabKey) {
        const conf = TABS.find(t => t.key === tabKey);
        if (!conf) return;
        setLoading(prev => ({ ...prev, [tabKey]: true }));
        try {
            const r = await fetch(`${API_BASE}/api/wiki-sandbox/${conf.path}`);
            if (r.ok) {
                const json = await r.json();
                setData(prev => ({ ...prev, [tabKey]: json }));
            }
        } catch { /* swallow */ }
        finally { setLoading(prev => ({ ...prev, [tabKey]: false })); }
    }
    useEffect(() => { load(tab); /* eslint-disable-next-line */ }, [tab]);

    async function runSync() {
        setSyncing(true);
        setSyncMsg('Sync started — runs in background (~2 minutes for the full 5-type sample).');
        try {
            await fetch(`${API_BASE}/api/wiki-sandbox/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: 20 }),
            });
            let elapsed = 0;
            const interval = setInterval(async () => {
                elapsed += 15;
                await load('sync_log');
                await load(tab);
                if (elapsed >= 240) {
                    clearInterval(interval);
                    setSyncing(false);
                    setSyncMsg('Sync polling stopped (4 min). Click tabs to refresh manually.');
                }
            }, 15000);
        } catch (err) {
            setSyncMsg(`Sync failed: ${err.message}`);
            setSyncing(false);
        }
    }

    return (
        <div className="ws-page">
            <div className="ws-header">
                <div>
                    <h2>Wiki sandbox</h2>
                    <p className="ws-sub">One example entity per category — raw JSON on the left, a mock page UI on the right. Use this to evaluate whether each entity type is worth promoting to a real feature.</p>
                </div>
                <button onClick={runSync} disabled={syncing} className="ws-sync">
                    {syncing ? 'Syncing…' : 'Sync from wiki'}
                </button>
            </div>
            {syncMsg && <div className="ws-msg">{syncMsg}</div>}

            <div className="ws-tabs">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        className={`ws-tab ${tab === t.key ? 'active' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                        {data[t.key] && <span className="ws-count">{data[t.key].length}</span>}
                    </button>
                ))}
            </div>

            <div className="ws-body">
                {loading[tab] && <p className="ws-empty">Loading…</p>}
                {!loading[tab] && (!data[tab] || data[tab].length === 0) && (
                    <p className="ws-empty">
                        No data yet for this tab. Click "Sync from wiki" above to pull a fresh sample.
                    </p>
                )}
                {data[tab] && data[tab].length > 0 && (
                    tab === 'sync_log'
                        ? <SyncLogTable rows={data[tab]} />
                        : <ExamplePane tab={tab} rows={data[tab]} />
                )}
            </div>
        </div>
    );
}

/* ============================================================
   Split pane: JSON dump on the left, mock UI on the right.
   ============================================================ */
function ExamplePane({ tab, rows }) {
    const [pickedSlug, setPickedSlug] = useState(rows[0]?.slug);
    const picked = useMemo(
        () => rows.find(r => r.slug === pickedSlug) || rows[0],
        [rows, pickedSlug]
    );

    if (!picked) return null;

    return (
        <>
            <div className="ws-toolbar">
                <label className="ws-picker">
                    Example
                    <select value={picked.slug} onChange={e => setPickedSlug(e.target.value)}>
                        {rows.map(r => (
                            <option key={r.slug} value={r.slug}>{r.name}</option>
                        ))}
                    </select>
                </label>
                <span className="ws-meta">{rows.length} total in sample</span>
            </div>

            <div className="ws-split">
                <div className="ws-json-pane">
                    <h3 className="ws-pane-head">Raw JSON</h3>
                    <pre className="ws-json">{JSON.stringify(stripIds(picked), null, 2)}</pre>
                </div>
                <div className="ws-mock-pane">
                    <h3 className="ws-pane-head">Page mockup</h3>
                    <div className="ws-mock">
                        {tab === 'creatures'      && <CreatureMock c={picked} />}
                        {tab === 'npcs'           && <NPCMock n={picked} />}
                        {tab === 'achievements'   && <AchievementMock a={picked} />}
                        {tab === 'locations'      && <LocationMock l={picked} />}
                        {tab === 'resource_nodes' && <ResourceNodeMock r={picked} />}
                    </div>
                </div>
            </div>
        </>
    );
}

function stripIds(obj) {
    // Drop noisy ORM fields so the JSON pane focuses on the actual data shape
    const out = { ...obj };
    delete out.id;
    delete out.createdAt;
    delete out.updatedAt;
    return out;
}

/* ============================================================
   Mockups — one per entity type. These are what a real
   /creatures/:slug, /achievements/:slug etc. page could look like.
   ============================================================ */

function CreatureMock({ c }) {
    return (
        <div className="mock-creature">
            <div className="mock-hero">
                <div className="mock-hero-img">{c.name.charAt(0)}</div>
                <div>
                    <h2 className="mock-title">{c.name}</h2>
                    {c.examine && <p className="mock-examine">"{c.examine}"</p>}
                    <div className="mock-tags">
                        {c.members === true && <span className="mock-tag mock-tag-p2p">Members</span>}
                        {c.members === false && <span className="mock-tag">F2P</span>}
                        {c.aggressive && <span className="mock-tag mock-tag-warn">Aggressive</span>}
                        {c.poisonous && <span className="mock-tag mock-tag-warn">Poisonous</span>}
                    </div>
                </div>
            </div>

            <div className="mock-stat-grid">
                <Stat label="Combat level" value={c.combat_level} />
                <Stat label="Lifepoints" value={c.lifepoints?.toLocaleString()} />
                <Stat label="Slayer level" value={c.slayer_level} />
                <Stat label="Slayer XP" value={c.slayer_experience} />
            </div>

            <div className="mock-section">
                <h4>Where to find</h4>
                <p className="mock-placeholder">(Location data lives in the JSONB <code>data</code> column — could be surfaced as a clickable region map.)</p>
            </div>

            <div className="mock-section">
                <h4>Drops</h4>
                <p className="mock-placeholder">(Future: join against the existing ItemDrop table to show a drop list with rarity + GE price.)</p>
            </div>

            <a className="mock-wiki" href={c.source_url} target="_blank" rel="noreferrer">View on wiki ↗</a>
        </div>
    );
}

function NPCMock({ n }) {
    return (
        <div className="mock-npc">
            <div className="mock-hero">
                <div className="mock-hero-img mock-hero-npc">{n.name.charAt(0)}</div>
                <div>
                    <h2 className="mock-title">{n.name}</h2>
                    {n.examine && <p className="mock-examine">"{n.examine}"</p>}
                </div>
            </div>

            <div className="mock-infobox">
                <Row label="Location" value={n.location} />
                <Row label="Role" value={n.role} />
                <Row label="Members" value={n.members == null ? null : (n.members ? 'P2P' : 'F2P')} />
            </div>

            <div className="mock-section">
                <h4>Related quests</h4>
                <p className="mock-placeholder">(Future: cross-reference with the Quest catalogue to surface quests this NPC is involved in.)</p>
            </div>

            <a className="mock-wiki" href={n.source_url} target="_blank" rel="noreferrer">View on wiki ↗</a>
        </div>
    );
}

function AchievementMock({ a }) {
    const diff = (a.difficulty || '').toLowerCase().replace(/\s+/g, '-');
    return (
        <div className="mock-ach">
            <div className="mock-ach-head">
                <h2 className="mock-title">{a.name}</h2>
                {a.difficulty && <span className={`mock-diff mock-diff-${diff}`}>{a.difficulty}</span>}
            </div>
            {a.description && <p className="mock-ach-desc">{a.description}</p>}

            <div className="mock-infobox">
                <Row label="Category" value={a.category} />
                <Row label="Subcategory" value={a.subcategory} />
                <Row label="Members" value={a.members == null ? null : (a.members ? 'P2P' : 'F2P')} />
            </div>

            <div className="mock-section">
                <h4>Completion tracking</h4>
                <p className="mock-placeholder">(Future: per-character checkbox stored on the user; progress bar across achievement categories.)</p>
                <button className="mock-cta">Mark as complete</button>
            </div>

            <a className="mock-wiki" href={a.source_url} target="_blank" rel="noreferrer">View on wiki ↗</a>
        </div>
    );
}

function LocationMock({ l }) {
    return (
        <div className="mock-loc">
            <div className="mock-hero">
                <div className="mock-hero-img mock-hero-loc">📍</div>
                <div>
                    <h2 className="mock-title">{l.name}</h2>
                    <div className="mock-tags">
                        {l.type && <span className="mock-tag">{l.type}</span>}
                        {l.region && <span className="mock-tag">{l.region}</span>}
                        {l.members === true && <span className="mock-tag mock-tag-p2p">Members</span>}
                    </div>
                </div>
            </div>

            <div className="mock-section">
                <h4>What's here</h4>
                <p className="mock-placeholder">(Future: cross-reference NPCs, monsters, shops, and resource nodes by location to power a "what can I do here" view.)</p>
            </div>

            <div className="mock-section">
                <h4>How to get here</h4>
                <p className="mock-placeholder">(Future: teleport options + lodestone link.)</p>
            </div>

            <a className="mock-wiki" href={l.source_url} target="_blank" rel="noreferrer">View on wiki ↗</a>
        </div>
    );
}

function ResourceNodeMock({ r }) {
    return (
        <div className="mock-res">
            <div className="mock-hero">
                <div className="mock-hero-img mock-hero-res">{nodeIcon(r.node_type)}</div>
                <div>
                    <h2 className="mock-title">{r.name}</h2>
                    <div className="mock-tags">
                        <span className="mock-tag">{r.node_type.replace('_', ' ')}</span>
                        {r.skill && <span className="mock-tag mock-tag-accent">{r.skill}</span>}
                        {r.members === true && <span className="mock-tag mock-tag-p2p">Members</span>}
                    </div>
                </div>
            </div>

            <div className="mock-stat-grid">
                <Stat label={`${r.skill || 'Skill'} level`} value={r.level} />
                <Stat label="XP per action" value={r.xp} />
                <Stat label="Yields" value={r.yields} />
                <Stat label="Location" value={r.location} />
            </div>

            <div className="mock-section">
                <h4>Best training method using this node</h4>
                <p className="mock-placeholder">(Future: link from skill-method pages straight to the node best suited for the player's level.)</p>
            </div>

            <a className="mock-wiki" href={r.source_url} target="_blank" rel="noreferrer">View on wiki ↗</a>
        </div>
    );
}

function nodeIcon(type) {
    return { tree: '🌳', rock: '⛏', fishing_spot: '🎣', farming_patch: '🌱' }[type] || '◆';
}

/* ============================================================
   Tiny shared bits
   ============================================================ */

function Stat({ label, value }) {
    return (
        <div className="mock-stat">
            <span className="mock-stat-label">{label}</span>
            <span className="mock-stat-value">{value ?? '—'}</span>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="mock-row">
            <span className="mock-row-label">{label}</span>
            <span className="mock-row-value">{value ?? '—'}</span>
        </div>
    );
}

function SyncLogTable({ rows }) {
    return (
        <table className="ws-table">
            <thead>
                <tr><th>When</th><th>Type</th><th>Status</th><th>Fetched</th><th>Created</th><th>Updated</th><th>Notes</th></tr>
            </thead>
            <tbody>
                {rows.map(l => (
                    <tr key={l.id}>
                        <td>{new Date(l.createdAt).toLocaleString()}</td>
                        <td>{l.entity_type}</td>
                        <td className={l.status === 'success' ? 'ws-ok' : 'ws-bad'}>{l.status}</td>
                        <td>{l.fetched}</td>
                        <td>{l.created}</td>
                        <td>{l.updated}</td>
                        <td>{l.notes || '—'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
