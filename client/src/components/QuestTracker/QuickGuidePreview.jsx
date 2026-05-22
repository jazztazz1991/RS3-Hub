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
                    <div className="qgp-meta-quick">
                        {data.metadata.start && (
                            <QuickFact label="Start" value={cleanShowOnMap(data.metadata.start)} />
                        )}
                        {data.metadata.members && (
                            <QuickFact label="Members" value={data.metadata.members} />
                        )}
                        {data.metadata.length && (
                            <QuickFact label="Length" value={data.metadata.length} />
                        )}
                    </div>

                    {data.metadata.kills && (
                        <CollapsibleField label="Combat">
                            <CombatList raw={data.metadata.kills} />
                        </CollapsibleField>
                    )}
                    {(data.metadata.items_list || data.metadata.items) && (
                        <CollapsibleField label="Items needed">
                            <ListOrProse list={data.metadata.items_list} raw={data.metadata.items} />
                        </CollapsibleField>
                    )}
                    {(data.metadata.recommended_list || data.metadata.recommended) && (
                        <CollapsibleField label="Recommended">
                            <ListOrProse list={data.metadata.recommended_list} raw={data.metadata.recommended} />
                        </CollapsibleField>
                    )}

                    {data.requirements?.length > 0 && (
                        <CollapsibleField label="Requirements">
                            <RequirementsTree categories={data.requirements} />
                        </CollapsibleField>
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

// Quick facts: 3 compact rows at top of sidebar (Start / Members / Length)
function QuickFact({ label, value }) {
    return (
        <div className="qgp-quick-fact">
            <span className="qgp-quick-label">{label}</span>
            <span className="qgp-quick-value">{value}</span>
        </div>
    );
}

// Collapsible field: long-form content (Combat, Items, Recommended, Requirements)
// with a clickable header. Default open; user can collapse to compact the sidebar.
function CollapsibleField({ label, children }) {
    const [open, setOpen] = useState(true);
    return (
        <div className={`qgp-collapse ${open ? 'open' : ''}`}>
            <header onClick={() => setOpen(o => !o)}>
                <span className="qgp-collapse-chevron">{open ? '▾' : '▸'}</span>
                <span className="qgp-collapse-label">{label}</span>
            </header>
            {open && <div className="qgp-collapse-body">{children}</div>}
        </div>
    );
}

// Combat list: wiki delivers as run-on prose ("Skeletons (level 70) Dried zombies (level 67) ...").
// We split on the level-pattern so each monster gets its own row.
function CombatList({ raw }) {
    const entries = useMemo(() => parseCombatList(raw), [raw]);
    if (!entries.length) return <div className="qgp-prose">{raw}</div>;
    return (
        <ul className="qgp-combat-list">
            {entries.map((e, i) => (
                <li key={i}>
                    <span className="qgp-combat-name">{e.name}</span>
                    {e.level && <span className="qgp-combat-level">lv {e.level}</span>}
                </li>
            ))}
        </ul>
    );
}

// Renders structured list when parser found a <ul>, otherwise falls back
// to splitting prose. Disclaimer (wiki boilerplate <i> preamble) shown dim.
function ListOrProse({ list, raw }) {
    if (list && list.items?.length) {
        return (
            <div className="qgp-prose">
                {list.disclaimer && (
                    <div className="qgp-prose-disclaimer">{list.disclaimer}</div>
                )}
                <ul className="qgp-bullet-list">
                    {list.items.map((it, i) => <li key={i}>{it}</li>)}
                </ul>
            </div>
        );
    }
    // Fallback: legacy run-on prose with the boilerplate stripped off the front
    const boilerplatePattern = /^Items from the tool belt are not listed unless[^.]+\.\s*/;
    const match = raw?.match?.(boilerplatePattern);
    const disclaimer = match ? match[0].trim() : null;
    const body = disclaimer ? raw.slice(match[0].length).trim() : (raw || '').trim();
    return (
        <div className="qgp-prose">
            {disclaimer && <div className="qgp-prose-disclaimer">{disclaimer}</div>}
            <div className="qgp-prose-body">{body}</div>
        </div>
    );
}

// "Show on map" link text appears at the end of Start strings — drop it,
// we already have wiki links elsewhere.
function cleanShowOnMap(s) {
    return String(s || '').replace(/\s*Show on map\s*$/i, '').trim();
}

// Requirements: render each category (Quests / Skills / Items) with its
// nested prereq tree. The first item in a Quest-category tree is the quest
// itself (self-link) — we skip that and show only the actual prereqs.
function RequirementsTree({ categories }) {
    return (
        <div className="qgp-req-tree">
            {categories.map((cat, ci) => {
                // For "Quests" category, root item is the current quest itself; flatten to its children
                const isQuests = /quest/i.test(cat.label);
                const rootItems = isQuests && cat.items.length === 1
                    ? cat.items[0].children
                    : cat.items;
                return (
                    <div key={ci} className="qgp-req-cat">
                        <div className="qgp-req-cat-label">{cat.label}</div>
                        {rootItems.length === 0
                            ? <div className="qgp-req-empty">None</div>
                            : <ReqNodes nodes={rootItems} depth={0} />}
                    </div>
                );
            })}
        </div>
    );
}

function ReqNodes({ nodes, depth }) {
    return (
        <ul className={`qgp-req-nodes depth-${depth}`}>
            {nodes.map((n, i) => (
                <li key={i}>
                    {n.href
                        ? <a href={`https://runescape.wiki${n.href}`} target="_blank" rel="noreferrer">{n.name}</a>
                        : <span>{n.name}</span>}
                    {n.children?.length > 0 && <ReqNodes nodes={n.children} depth={depth + 1} />}
                </li>
            ))}
        </ul>
    );
}

// Best-effort split of a Combat string into name+level pairs.
function parseCombatList(raw) {
    if (!raw) return [];
    let text = String(raw);
    // Strip the optional "Some of these types of monsters: " preamble
    text = text.replace(/^.*?monsters?:\s*/i, '').trim();
    // Match "<Name> (level <num>)" repeated; name is everything up to " ("
    const re = /([A-Z][^(]*?)\s*\(level\s*([\d,–\- ]+)\)/g;
    const out = [];
    let m;
    while ((m = re.exec(text)) !== null) {
        out.push({
            name: m[1].replace(/[,;]?\s*$/, '').trim(),
            level: m[2].replace(/\s+/g, '').trim(),
        });
    }
    return out;
}
