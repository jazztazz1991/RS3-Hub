import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch, API_BASE, JsonPane, Card, KV, field, fieldNum, fmtMembers, Sections } from './WikiShared';
import './Wiki.css';

export function AchievementsList() {
    const { data, loading, error } = useFetch(`${API_BASE}/api/wiki-sandbox/achievements`);

    const groups = useMemo(() => {
        const out = {};
        for (const a of data || []) {
            const k = a.category || 'Uncategorised';
            (out[k] = out[k] || []).push(a);
        }
        return out;
    }, [data]);

    return (
        <div className="wiki-page">
            <div className="wiki-header">
                <div>
                    <h2>Achievements</h2>
                    <p className="wiki-sub">In-game achievements grouped by category. Per-character tracking coming soon.</p>
                </div>
                <Link to="/wiki" className="wiki-back">← Wiki home</Link>
            </div>

            {loading && <p className="wiki-empty">Loading…</p>}
            {error && <p className="wiki-error">Error: {error}</p>}
            {!loading && data?.length === 0 && (
                <p className="wiki-empty">No achievements seeded yet. Visit the <Link to="/wiki-sandbox">sandbox</Link> to run a sync.</p>
            )}

            {Object.entries(groups).map(([cat, items]) => (
                <div key={cat} className="wiki-group">
                    <h3 className="wiki-group-head">{cat} <span className="wiki-count">({items.length})</span></h3>
                    <ul className="wiki-group-list">
                        {items.map(a => (
                            <li key={a.id} className="wiki-group-item">
                                <Link to={`/wiki/achievements/${a.slug}`}>{a.name}</Link>
                                {a.difficulty && (
                                    <span className={`wiki-diff wiki-diff-${String(a.difficulty).toLowerCase().replace(/\s+/g, '-')}`}>
                                        {a.difficulty}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export function AchievementDetail() {
    const { slug } = useParams();
    const { data: a, loading, error } = useFetch(`${API_BASE}/api/wiki-sandbox/achievements/${slug}`);

    if (loading) return <div className="wiki-page"><p className="wiki-empty">Loading…</p></div>;
    if (error || !a) return <div className="wiki-page"><p className="wiki-error">Error: {error || 'Not found'}</p></div>;

    const points       = fieldNum(a, 'rs points', 'points', 'achievement points');
    const reward       = field(a, 'reward', 'rewards');
    const requirements = field(a, 'requirements', 'requirement');
    const recommended  = field(a, 'recommended');
    const release      = field(a, 'release', 'release date');
    const update       = field(a, 'update');
    const seriesIcon   = field(a, 'series');

    const diff = (a.difficulty || '').toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="wiki-page">
            <div className="wiki-header">
                <Link to="/wiki/achievements" className="wiki-back">← All achievements</Link>
            </div>

            <div className="wiki-detail-split">
                <div>
                    <div className={`cr-hero cr-hero-ach cr-hero-diff-${diff}`}>
                        <div className="cr-hero-img cr-hero-img-ach">🏆</div>
                        <div className="cr-hero-meta">
                            <div className="ach-title-row">
                                <h2 className="cr-hero-name">{a.name}</h2>
                                {a.difficulty && <span className={`wiki-diff wiki-diff-${diff}`}>{a.difficulty}</span>}
                            </div>
                            {a.description && <p className="ach-desc">{a.description}</p>}
                            <div className="cr-tags">
                                {a.category && <span className="wiki-tag wiki-tag-accent">{a.category}</span>}
                                {a.subcategory && <span className="wiki-tag">{a.subcategory}</span>}
                                {a.members === true && <span className="wiki-tag wiki-tag-p2p">Members</span>}
                                {a.members === false && <span className="wiki-tag">F2P</span>}
                                {seriesIcon && <span className="wiki-tag">{seriesIcon}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="cr-grid">
                        {requirements && (
                            <Card title="Requirements" accent="requirements">
                                <p className="ach-block">{requirements}</p>
                            </Card>
                        )}

                        {(reward || points != null) && (
                            <Card title="Rewards" accent="rewards">
                                {points != null && <KV label="Achievement points" value={points} />}
                                {reward && <p className="ach-block">{reward}</p>}
                            </Card>
                        )}

                        {recommended && (
                            <Card title="Recommended" accent="role">
                                <p className="ach-block">{recommended}</p>
                            </Card>
                        )}

                        <Card title="Category">
                            <KV label="Category" value={a.category} />
                            <KV label="Subcategory" value={a.subcategory} />
                            <KV label="Difficulty" value={a.difficulty} />
                            <KV label="Members" value={fmtMembers(a.members)} />
                        </Card>

                        <Card title="Meta">
                            <KV label="Released" value={release} />
                            <KV label="Update" value={update} />
                        </Card>
                    </div>

                    <Sections row={a} only={['description', 'requirements', 'rewards', 'reward']} />

                    <section className="cr-card cr-drops">
                        <h3 className="cr-card-title">Completion tracking</h3>
                        <p className="cr-empty-drops">
                            <strong>Next step</strong>: per-character checkbox stored on the user, plus aggregate
                            progress bars across each achievement category so users can see "47/120 Hard achievements".
                        </p>
                        <button className="ach-cta" disabled>Mark as complete (coming soon)</button>
                    </section>

                    <a className="wiki-wiki-link" href={a.source_url} target="_blank" rel="noreferrer">
                        View on runescape.wiki ↗
                    </a>
                </div>

                <JsonPane data={a} />
            </div>
        </div>
    );
}
