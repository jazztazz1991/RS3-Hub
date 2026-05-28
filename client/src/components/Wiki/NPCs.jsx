import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch, API_BASE, JsonPane, Card, KV, field, fmtMembers, Sections } from './WikiShared';
import './Wiki.css';

export function NPCsList() {
    const { data, loading, error } = useFetch(`${API_BASE}/api/wiki-sandbox/npcs`);
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!data) return [];
        return data.filter(n => !search || n.name.toLowerCase().includes(search.toLowerCase()));
    }, [data, search]);

    return (
        <div className="wiki-page">
            <div className="wiki-header">
                <div>
                    <h2>NPCs</h2>
                    <p className="wiki-sub">Non-combat characters — shopkeepers, quest givers, story characters.</p>
                </div>
                <Link to="/wiki" className="wiki-back">← Wiki home</Link>
            </div>

            <div className="wiki-toolbar">
                <input className="wiki-search" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} />
                <span className="wiki-count">{filtered.length} of {data?.length || 0}</span>
            </div>

            {loading && <p className="wiki-empty">Loading…</p>}
            {error && <p className="wiki-error">Error: {error}</p>}
            {!loading && data?.length === 0 && (
                <p className="wiki-empty">No NPCs seeded yet. Visit the <Link to="/wiki-sandbox">sandbox</Link> to run a sync.</p>
            )}

            {filtered.length > 0 && (
                <table className="wiki-table">
                    <thead>
                        <tr><th>Name</th><th>Location</th><th>Role</th><th>Members</th><th>Examine</th></tr>
                    </thead>
                    <tbody>
                        {filtered.map(n => (
                            <tr key={n.id}>
                                <td><Link to={`/wiki/npcs/${n.slug}`}>{n.name}</Link></td>
                                <td>{n.location || '—'}</td>
                                <td>{n.role || '—'}</td>
                                <td>{fmtMembers(n.members) || '—'}</td>
                                <td>{n.examine || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export function NPCDetail() {
    const { slug } = useParams();
    const { data: n, loading, error } = useFetch(`${API_BASE}/api/wiki-sandbox/npcs/${slug}`);

    if (loading) return <div className="wiki-page"><p className="wiki-empty">Loading…</p></div>;
    if (error || !n) return <div className="wiki-page"><p className="wiki-error">Error: {error || 'Not found'}</p></div>;

    const race        = field(n, 'race', 'species');
    const gender      = field(n, 'gender', 'sex');
    const age         = field(n, 'age');
    const occupation  = field(n, 'occupation', 'role', 'function');
    const sells       = field(n, 'sells');
    const options     = field(n, 'options');
    const npcId       = field(n, 'npc id', 'id');
    const release     = field(n, 'release', 'release date');
    const removal     = field(n, 'removal');
    const alignment   = field(n, 'alignment');
    const quest       = field(n, 'quest');
    const status      = field(n, 'status');

    return (
        <div className="wiki-page">
            <div className="wiki-header">
                <Link to="/wiki/npcs" className="wiki-back">← All NPCs</Link>
            </div>

            <div className="wiki-detail-split">
                <div>
                    <div className="cr-hero cr-hero-npc">
                        <div className="cr-hero-img cr-hero-img-npc">{n.name.charAt(0)}</div>
                        <div className="cr-hero-meta">
                            <h2 className="cr-hero-name">{n.name}</h2>
                            <div className="cr-hero-sub">
                                {race && <span>{race}</span>}
                                {occupation && <span>· {occupation}</span>}
                                {n.location && <span>· {n.location}</span>}
                            </div>
                            {n.examine && <p className="cr-examine">"{n.examine}"</p>}
                            <div className="cr-tags">
                                {n.members === true && <span className="wiki-tag wiki-tag-p2p">Members</span>}
                                {n.members === false && <span className="wiki-tag">F2P</span>}
                                {status && <span className="wiki-tag">{status}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="cr-grid">
                        <Card title="Identity" accent="identity">
                            <KV label="Race" value={race} />
                            <KV label="Gender" value={gender} />
                            <KV label="Age" value={age} />
                            <KV label="Alignment" value={alignment} />
                        </Card>

                        <Card title="Location" accent="location">
                            <KV label="Found at" value={n.location} />
                            <p className="cr-empty-soft">
                                Cross-references with location catalogue + map coords coming soon.
                            </p>
                        </Card>

                        <Card title="Role" accent="role">
                            <KV label="Occupation" value={occupation} />
                            <KV label="Sells" value={sells} />
                            <KV label="Options" value={options} />
                        </Card>

                        <Card title="Meta">
                            <KV label="NPC ID" value={npcId} />
                            <KV label="Released" value={release} />
                            <KV label="Removed" value={removal} />
                            <KV label="Members" value={fmtMembers(n.members)} />
                        </Card>

                        {quest && (
                            <Card title="Quest involvement" accent="quest">
                                <KV label="Quest" value={quest} />
                            </Card>
                        )}
                    </div>

                    <Sections row={n} only={['location', 'history', 'lore', 'about', 'background']} />

                    <section className="cr-card cr-drops">
                        <h3 className="cr-card-title">Related quests</h3>
                        <p className="cr-empty-drops">
                            <strong>Next step</strong>: cross-reference the quest catalogue to surface every quest this
                            NPC appears in (giver, target, ally, etc.) and link directly to the Quick Guide for each.
                        </p>
                    </section>

                    <a className="wiki-wiki-link" href={n.source_url} target="_blank" rel="noreferrer">
                        View on runescape.wiki ↗
                    </a>
                </div>

                <JsonPane data={n} />
            </div>
        </div>
    );
}
