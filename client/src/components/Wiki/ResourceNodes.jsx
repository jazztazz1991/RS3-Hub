import { useState, useMemo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch, API_BASE, JsonPane, Card, KV, field, fmtMembers, Sections } from './WikiShared';
import './Wiki.css';

const NODE_ICON = { tree: '🌳', rock: '⛏', fishing_spot: '🎣', farming_patch: '🌱' };
const NODE_LABEL = { tree: 'Tree', rock: 'Rock', fishing_spot: 'Fishing spot', farming_patch: 'Farming patch' };

export function ResourceNodesList() {
    const { data, loading, error } = useFetch(`${API_BASE}/api/wiki-sandbox/resource-nodes`);

    const byType = useMemo(() => {
        const out = {};
        for (const r of data || []) (out[r.node_type] = out[r.node_type] || []).push(r);
        return out;
    }, [data]);

    const [sub, setSub] = useState(null);
    useEffect(() => {
        if (sub == null && Object.keys(byType).length > 0) setSub(Object.keys(byType)[0]);
    }, [byType, sub]);

    const subRows = sub ? byType[sub] || [] : [];

    return (
        <div className="wiki-page">
            <div className="wiki-header">
                <div>
                    <h2>Resource nodes</h2>
                    <p className="wiki-sub">Trees, rocks, fishing spots, and farming patches — anywhere you can train a gathering skill.</p>
                </div>
                <Link to="/wiki" className="wiki-back">← Wiki home</Link>
            </div>

            {loading && <p className="wiki-empty">Loading…</p>}
            {error && <p className="wiki-error">Error: {error}</p>}
            {!loading && data?.length === 0 && (
                <p className="wiki-empty">No resource nodes seeded yet. Visit the <Link to="/wiki-sandbox">sandbox</Link> to run a sync.</p>
            )}

            {Object.keys(byType).length > 0 && (
                <div className="wiki-subtabs">
                    {Object.entries(byType).map(([t, list]) => (
                        <button key={t} className={`wiki-subtab ${sub === t ? 'active' : ''}`} onClick={() => setSub(t)}>
                            {NODE_ICON[t] || '◆'} {t.replace('_', ' ')}
                            <span className="wiki-subtab-count">{list.length}</span>
                        </button>
                    ))}
                </div>
            )}

            {subRows.length > 0 && (
                <table className="wiki-table">
                    <thead>
                        <tr><th>Name</th><th>Skill</th><th>Level</th><th>XP</th><th>Yields</th><th>Members</th></tr>
                    </thead>
                    <tbody>
                        {subRows.map(r => (
                            <tr key={r.id}>
                                <td><Link to={`/wiki/resource-nodes/${r.slug}`}>{r.name}</Link></td>
                                <td>{r.skill || '—'}</td>
                                <td>{r.level ?? '—'}</td>
                                <td>{r.xp ?? '—'}</td>
                                <td>{r.yields || '—'}</td>
                                <td>{fmtMembers(r.members) || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export function ResourceNodeDetail() {
    const { slug } = useParams();
    const { data: r, loading, error } = useFetch(`${API_BASE}/api/wiki-sandbox/resource-nodes/${slug}`);

    if (loading) return <div className="wiki-page"><p className="wiki-empty">Loading…</p></div>;
    if (error || !r) return <div className="wiki-page"><p className="wiki-error">Error: {error || 'Not found'}</p></div>;

    const tool      = field(r, 'tool', 'tools');
    const respawn   = field(r, 'respawn', 'respawn time');
    const release   = field(r, 'release', 'release date');
    const speed     = field(r, 'speed', 'gathering speed');
    const quest     = field(r, 'quest', 'quest requirement');

    return (
        <div className="wiki-page">
            <div className="wiki-header">
                <Link to="/wiki/resource-nodes" className="wiki-back">← All resource nodes</Link>
            </div>

            <div className="wiki-detail-split">
                <div>
                    <div className={`cr-hero cr-hero-res cr-hero-res-${r.node_type}`}>
                        <div className="cr-hero-img cr-hero-img-res">{NODE_ICON[r.node_type] || '◆'}</div>
                        <div className="cr-hero-meta">
                            <h2 className="cr-hero-name">{r.name}</h2>
                            <div className="cr-hero-sub">
                                <span>{NODE_LABEL[r.node_type] || r.node_type}</span>
                                {r.skill && <span>· {r.skill}</span>}
                                {r.level != null && <span>· Level <strong>{r.level}</strong></span>}
                            </div>
                            <div className="cr-tags">
                                {r.skill && <span className="wiki-tag wiki-tag-accent">{r.skill}</span>}
                                {r.members === true && <span className="wiki-tag wiki-tag-p2p">Members</span>}
                                {r.members === false && <span className="wiki-tag">F2P</span>}
                            </div>
                        </div>
                    </div>

                    <div className="cr-grid">
                        <Card title="Skill requirement" accent="xp">
                            <KV label={`${r.skill || 'Skill'} level`} value={r.level} />
                            <KV label="XP per action" value={r.xp} />
                            <KV label="Quest required" value={quest} />
                        </Card>

                        <Card title="Yields" accent="rewards">
                            <KV label="Produces" value={r.yields} />
                            <p className="cr-empty-soft">
                                Yield item linking coming soon (click through to item-catalogue + GE price).
                            </p>
                        </Card>

                        <Card title="Mechanics" accent="defense">
                            <KV label="Tool" value={tool} />
                            <KV label="Gathering speed" value={speed} />
                            <KV label="Respawn time" value={respawn} />
                        </Card>

                        <Card title="Location" accent="location">
                            <KV label="Found at" value={r.location} />
                            <p className="cr-empty-soft">
                                Map placeholder. Future: link to the Location catalogue entry.
                            </p>
                        </Card>

                        <Card title="Meta">
                            <KV label="Released" value={release} />
                            <KV label="Node type" value={NODE_LABEL[r.node_type] || r.node_type} />
                            <KV label="Members" value={fmtMembers(r.members)} />
                        </Card>
                    </div>

                    <Sections row={r} only={['description', 'about', 'mechanics']} />

                    <section className="cr-card cr-drops">
                        <h3 className="cr-card-title">Best training method using this node</h3>
                        <p className="cr-empty-drops">
                            <strong>Next step</strong>: cross-reference with the <em>Skill methods</em> page so each
                            node links directly to the training plan that uses it.
                        </p>
                    </section>

                    <a className="wiki-wiki-link" href={r.source_url} target="_blank" rel="noreferrer">
                        View on runescape.wiki ↗
                    </a>
                </div>

                <JsonPane data={r} />
            </div>
        </div>
    );
}
