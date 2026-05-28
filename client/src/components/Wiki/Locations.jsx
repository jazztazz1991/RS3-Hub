import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch, API_BASE, JsonPane, Card, KV, field, fmtMembers, Sections } from './WikiShared';
import './Wiki.css';

export function LocationsList() {
    const { data, loading, error } = useFetch(`${API_BASE}/api/wiki-sandbox/locations`);

    const groups = useMemo(() => {
        const out = {};
        for (const l of data || []) {
            const k = l.region || 'Unspecified region';
            (out[k] = out[k] || []).push(l);
        }
        return out;
    }, [data]);

    return (
        <div className="wiki-page">
            <div className="wiki-header">
                <div>
                    <h2>Locations</h2>
                    <p className="wiki-sub">Cities, dungeons, regions, and other in-game places.</p>
                </div>
                <Link to="/wiki" className="wiki-back">← Wiki home</Link>
            </div>

            {loading && <p className="wiki-empty">Loading…</p>}
            {error && <p className="wiki-error">Error: {error}</p>}
            {!loading && data?.length === 0 && (
                <p className="wiki-empty">No locations seeded yet. Visit the <Link to="/wiki-sandbox">sandbox</Link> to run a sync.</p>
            )}

            {Object.entries(groups).map(([region, items]) => (
                <div key={region} className="wiki-group">
                    <h3 className="wiki-group-head">{region} <span className="wiki-count">({items.length})</span></h3>
                    <ul className="wiki-group-list">
                        {items.map(l => (
                            <li key={l.id} className="wiki-group-item">
                                <Link to={`/wiki/locations/${l.slug}`}>{l.name}</Link>
                                {l.type && <span className="wiki-tag">{l.type}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export function LocationDetail() {
    const { slug } = useParams();
    const { data: l, loading, error } = useFetch(`${API_BASE}/api/wiki-sandbox/locations/${slug}`);

    if (loading) return <div className="wiki-page"><p className="wiki-empty">Loading…</p></div>;
    if (error || !l) return <div className="wiki-page"><p className="wiki-error">Error: {error || 'Not found'}</p></div>;

    const kingdom    = field(l, 'kingdom');
    const ruler      = field(l, 'ruler', 'leader');
    const inhabitants= field(l, 'inhabitants', 'residents');
    const music      = field(l, 'music');
    const teleports  = field(l, 'teleports', 'teleport');
    const climate    = field(l, 'climate');
    const release    = field(l, 'release', 'release date');
    const removal    = field(l, 'removal');

    return (
        <div className="wiki-page">
            <div className="wiki-header">
                <Link to="/wiki/locations" className="wiki-back">← All locations</Link>
            </div>

            <div className="wiki-detail-split">
                <div>
                    <div className="cr-hero cr-hero-loc-banner">
                        <div className="cr-hero-img cr-hero-img-loc">📍</div>
                        <div className="cr-hero-meta">
                            <h2 className="cr-hero-name">{l.name}</h2>
                            <div className="cr-hero-sub">
                                {l.type && <span>{l.type}</span>}
                                {l.region && <span>· {l.region}</span>}
                                {kingdom && <span>· {kingdom}</span>}
                            </div>
                            <div className="cr-tags">
                                {l.members === true && <span className="wiki-tag wiki-tag-p2p">Members</span>}
                                {l.members === false && <span className="wiki-tag">F2P</span>}
                            </div>
                        </div>
                    </div>

                    <div className="cr-grid">
                        <Card title="Geography" accent="location">
                            <KV label="Type" value={l.type} />
                            <KV label="Region" value={l.region} />
                            <KV label="Kingdom" value={kingdom} />
                            <KV label="Climate" value={climate} />
                        </Card>

                        <Card title="Who's in charge" accent="identity">
                            <KV label="Ruler" value={ruler} />
                            <KV label="Inhabitants" value={inhabitants} />
                        </Card>

                        <Card title="How to get here" accent="quest">
                            <KV label="Teleports" value={teleports} />
                            <p className="cr-empty-soft">
                                Lodestone + teleport-tab links coming soon.
                            </p>
                        </Card>

                        <Card title="Ambience" accent="role">
                            <KV label="Music" value={music} />
                        </Card>

                        <Card title="Meta">
                            <KV label="Released" value={release} />
                            <KV label="Removed" value={removal} />
                            <KV label="Members" value={fmtMembers(l.members)} />
                        </Card>
                    </div>

                    <Sections row={l} only={['description', 'history', 'lore', 'about', 'geography', 'overview']} />

                    <section className="cr-card cr-drops">
                        <h3 className="cr-card-title">What's here</h3>
                        <p className="cr-empty-drops">
                            <strong>Next step</strong>: cross-reference NPCs, monsters, shops, and resource nodes that
                            live in <em>{l.name}</em> to power a one-stop "everything in this area" view.
                        </p>
                    </section>

                    <a className="wiki-wiki-link" href={l.source_url} target="_blank" rel="noreferrer">
                        View on runescape.wiki ↗
                    </a>
                </div>

                <JsonPane data={l} />
            </div>
        </div>
    );
}
