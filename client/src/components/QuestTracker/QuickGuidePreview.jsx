import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './QuickGuidePreview.css';

const API_BASE = import.meta.env.VITE_API_URL || '';
const DEFAULT_QUEST = "Plague's End";

export default function QuickGuidePreview() {
    const { quest: questParam } = useParams();
    const quest = questParam ? decodeURIComponent(questParam) : DEFAULT_QUEST;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [completed, setCompleted] = useState({}); // local-only step ticks
    const [collapsed, setCollapsed] = useState({}); // per-section collapse

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetch(`${API_BASE}/api/quest-quick-guide?title=${encodeURIComponent(quest)}`)
            .then(async r => {
                if (!r.ok) {
                    const d = await r.json().catch(() => ({}));
                    throw new Error(d.message || `Failed (${r.status})`);
                }
                return r.json();
            })
            .then(d => { if (!cancelled) setData(d); })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [quest]);

    const totalSteps = useMemo(() => {
        if (!data?.sections) return 0;
        return data.sections.reduce((s, sec) =>
            s + sec.steps.reduce((ss, st) =>
                ss + st.rows.length + (st.action ? 1 : 0), 0), 0);
    }, [data]);
    const doneCount = Object.values(completed).filter(Boolean).length;
    const pct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

    if (loading) return <div className="qgp-status">Loading {quest} from the wiki…</div>;
    if (error) return <div className="qgp-error">Error: {error}</div>;
    if (!data) return null;

    return (
        <div className="qgp">
            <div className="qgp-header">
                <div>
                    <span className="qgp-badge">Quick guide preview</span>
                    <h1>{data.quest}</h1>
                </div>
                <a className="qgp-wiki-link" href={data.wiki_url} target="_blank" rel="noreferrer">
                    View on wiki ↗
                </a>
            </div>

            {/* Progress bar from local checkbox state */}
            <div className="qgp-progress">
                <div className="qgp-progress-track">
                    <div className="qgp-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="qgp-progress-label">
                    {doneCount} / {totalSteps} checked &nbsp;({pct}%)
                </span>
            </div>

            <div className="qgp-body">
                <aside className="qgp-meta">
                    <h3>Quest details</h3>
                    {data.metadata.start && (
                        <Field label="Start">{data.metadata.start}</Field>
                    )}
                    {data.metadata.members && (
                        <Field label="Members">{data.metadata.members}</Field>
                    )}
                    {data.metadata.length && (
                        <Field label="Length">{data.metadata.length}</Field>
                    )}
                    {data.metadata.kills && (
                        <Field label="Combat">{data.metadata.kills}</Field>
                    )}
                    {data.metadata.items && (
                        <Field label="Items needed" wrap>{data.metadata.items}</Field>
                    )}
                    {data.metadata.recommended && (
                        <Field label="Recommended" wrap>{data.metadata.recommended}</Field>
                    )}

                    {data.requirements?.length > 0 && (
                        <>
                            <h3>Requirements</h3>
                            <ul className="qgp-req-list">
                                {data.requirements.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </aside>

                <main className="qgp-main">
                    {data.sections.length === 0 && (
                        <p className="qgp-empty">
                            No step sections found. Either the wiki Quick guide is empty
                            or the parser missed something.
                        </p>
                    )}
                    {data.sections.map((section, sIdx) => {
                        const isCollapsed = !!collapsed[sIdx];
                        return (
                            <section key={sIdx} className="qgp-section">
                                <header
                                    className="qgp-section-header"
                                    onClick={() => setCollapsed(c => ({ ...c, [sIdx]: !isCollapsed }))}
                                >
                                    <span className="qgp-section-chevron">{isCollapsed ? '▸' : '▾'}</span>
                                    <span className="qgp-section-number">{sIdx + 1}</span>
                                    <h2>{section.name}</h2>
                                    <span className="qgp-section-meta">
                                        {section.steps.reduce((s, st) => s + st.rows.length, 0)} entries
                                    </span>
                                </header>
                                {!isCollapsed && (
                                    <ol className="qgp-step-list">
                                        {section.steps.map((step, stepIdx) => {
                                            const actionKey = `${sIdx}-${stepIdx}-action`;
                                            const actionDone = !!completed[actionKey];
                                            return (
                                                <li key={stepIdx} className={`qgp-step ${actionDone ? 'done' : ''}`}>
                                                    {step.action && (
                                                        <div
                                                            className="qgp-step-action"
                                                            onClick={() => setCompleted(c => ({ ...c, [actionKey]: !actionDone }))}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={actionDone}
                                                                onChange={() => { }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            <span className="qgp-action-text">{step.action.text}</span>
                                                            {step.action.links?.length > 0 && (
                                                                <span className="qgp-row-links">
                                                                    {step.action.links.slice(0, 4).map((l, li) => (
                                                                        <a
                                                                            key={li}
                                                                            href={`https://runescape.wiki${l.href || `/w/${encodeURIComponent(l.title)}`}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            onClick={e => e.stopPropagation()}
                                                                            title={l.title}
                                                                        >
                                                                            {l.display}
                                                                        </a>
                                                                    ))}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {step.rows.length > 0 && (
                                                        <div className="qgp-dialogue">
                                                            <div className="qgp-dialogue-label">Dialogue</div>
                                                            {step.rows.map((row, rIdx) => {
                                                                const key = `${sIdx}-${stepIdx}-${rIdx}`;
                                                                const isDone = !!completed[key];
                                                                return (
                                                                    <div
                                                                        key={rIdx}
                                                                        className={`qgp-row ${isDone ? 'done' : ''}`}
                                                                        onClick={() => setCompleted(c => ({ ...c, [key]: !isDone }))}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isDone}
                                                                            onChange={() => { }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                        <span className="qgp-row-num">{row.num}</span>
                                                                        <span className="qgp-row-text">{row.text}</span>
                                                                        {row.links.length > 0 && (
                                                                            <span className="qgp-row-links">
                                                                                {row.links.slice(0, 4).map((l, li) => (
                                                                                    <a
                                                                                        key={li}
                                                                                        href={`https://runescape.wiki${l.href || `/w/${encodeURIComponent(l.title)}`}`}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        onClick={e => e.stopPropagation()}
                                                                                        title={l.title}
                                                                                    >
                                                                                        {l.display}
                                                                                    </a>
                                                                                ))}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ol>
                                )}
                            </section>
                        );
                    })}
                </main>
            </div>

            <footer className="qgp-footer">
                <p>
                    This is a <strong>preview</strong> built by scraping the live wiki Quick guide.
                    Check-marks are local-only (not saved). Linked items / NPCs / skills go to the wiki.
                    Try another quest: <code>/quest-preview/Cook's Assistant</code> · <code>/quest-preview/Dragon Slayer</code> · <code>/quest-preview/While Guthix Sleeps</code>
                </p>
            </footer>
        </div>
    );
}

function Field({ label, children, wrap }) {
    return (
        <div className={`qgp-field ${wrap ? 'qgp-field-wrap' : ''}`}>
            <span className="qgp-field-label">{label}</span>
            <span className="qgp-field-value">{children}</span>
        </div>
    );
}
