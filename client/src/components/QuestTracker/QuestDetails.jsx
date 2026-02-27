import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter } from '../../context/CharacterContext';
import { useQuestLog } from '../../hooks/useQuestLog';
import { QUEST_DATA } from '../../data/quests/questData';
import './QuestDetails.css';

const QuestDetails = () => {
    const { questTitle } = useParams();
    const navigate = useNavigate();
    const { characterData } = useCharacter();
    const { completedQuests, toggleQuest } = useQuestLog();

    const quest = useMemo(() => {
        const decodedTitle = decodeURIComponent(questTitle).replace(/_/g, ' ');
        return QUEST_DATA.find(q => q.title.toLowerCase() === decodedTitle.toLowerCase());
    }, [questTitle]);

    const [lightbox, setLightbox] = useState(null);

    useEffect(() => {
        if (!lightbox) return;
        const handler = (e) => { if (e.key === 'Escape') setLightbox(null); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightbox]);

    const [checkedSteps, setCheckedSteps] = useState(() => {
        if (!quest) return new Set();
        const saved = localStorage.getItem(`quest_progress_${quest.title}`);
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    const getQuestParents = useCallback((title) => {
        const q = QUEST_DATA.find(x => x.title === title);
        if (!q || !q.questReqs) return [];
        return q.questReqs;
    }, []);

    useEffect(() => {
        if (quest) {
            localStorage.setItem(`quest_progress_${quest.title}`, JSON.stringify([...checkedSteps]));
        }
    }, [checkedSteps, quest]);

    if (!quest) {
        return (
            <div className="quest-details-container">
                <h2>Quest not found</h2>
                <button onClick={() => navigate('/quests')}>Back to Tracker</button>
            </div>
        );
    }

    const isCompleted = completedQuests.has(quest.title);

    const statsMap = useMemo(() => {
        if (!characterData) return {};
        const map = {};
        characterData.forEach(s => { map[s.name] = s.level; });
        return map;
    }, [characterData]);

    const toggleStep = (index) => {
        setCheckedSteps(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const QuestReqItem = ({ title }) => {
        const done = completedQuests.has(title);
        const parents = getQuestParents(title);
        return (
            <li className="qreq-item">
                <span
                    className={`qreq-link ${done ? 'done' : 'missing'}`}
                    onClick={() => navigate(`/quests/${encodeURIComponent(title.replace(/ /g, '_'))}`)}
                >
                    <span className="qreq-icon">{done ? '✓' : '✗'}</span>
                    {title}
                </span>
                {parents.length > 0 && (
                    <ul className="qreq-children">
                        {parents.map((p, i) => <QuestReqItem key={i} title={p} />)}
                    </ul>
                )}
            </li>
        );
    };

    const subQuests = QUEST_DATA.filter(q => q.title.startsWith(`${quest.title}: `));

    const hasQuestReqs = quest.questReqs && quest.questReqs.length > 0;
    const hasSkillReqs = quest.skillReqs && quest.skillReqs.length > 0;
    const hasItemReqs = quest.itemReqs && quest.itemReqs.length > 0 && !(quest.itemReqs.length === 1 && quest.itemReqs[0] === 'None');
    const hasRecommended = quest.recommendedItems && quest.recommendedItems.length > 0;

    return (
        <div className="quest-details-container">
            {lightbox && (
                <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
                    <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close">✕</button>
                    <img
                        src={lightbox.src}
                        alt={lightbox.alt}
                        className="lightbox-img"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}

            <button className="btn-back" onClick={() => navigate('/quests')}>← Back to Tracker</button>

            {/* Title bar */}
            <div className="qd-page-title">
                <h1>{quest.title}</h1>
                <div className="qd-actions">
                    <a
                        href={`https://runescape.wiki/w/${quest.title.replace(/ /g, '_')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-wiki"
                    >
                        Wiki ↗
                    </a>
                    <button
                        className={`btn-toggle-main ${isCompleted ? 'completed' : ''}`}
                        onClick={() => toggleQuest(quest.title, !isCompleted)}
                    >
                        {isCompleted ? '✓ Completed' : 'Mark Complete'}
                    </button>
                </div>
            </div>

            {/* Infobox */}
            <aside className="qd-infobox">
                <div className="qd-infobox-header">{quest.title}</div>
                <table className="qd-infobox-table">
                    <tbody>
                        <tr><th>Members</th><td>{quest.isMembers ? 'Yes' : 'No'}</td></tr>
                        <tr><th>Length</th><td>{quest.length}</td></tr>
                        <tr><th>Difficulty</th><td>{quest.difficulty}</td></tr>
                        {quest.series && <tr><th>Series</th><td>{quest.series}</td></tr>}
                        <tr><th>Quest Points</th><td>{quest.questPoints}</td></tr>
                    </tbody>
                </table>
            </aside>

            {/* Main body */}
            <div className="qd-main-body">

                {/* Requirements */}
                <h2 className="qd-section-header">Requirements</h2>

                {!hasQuestReqs && !hasSkillReqs ? (
                    <p className="req-none">No requirements.</p>
                ) : (
                    <div className="req-columns">
                        {hasSkillReqs && (
                            <div className="req-block">
                                <h3 className="req-subheader">Skills</h3>
                                <div className="skill-req-grid">
                                    {quest.skillReqs.map((req, i) => {
                                        const met = (statsMap[req.skill] || 0) >= req.level;
                                        return (
                                            <div key={i} className={`skill-chip ${met ? 'met' : 'unmet'}`}>
                                                <span className="skill-chip-level">{req.level}</span>
                                                <span className="skill-chip-name">{req.skill}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {hasQuestReqs && (
                            <div className="req-block">
                                <h3 className="req-subheader">Quests</h3>
                                <ul className="qreq-list">
                                    {quest.questReqs.map((req, i) => (
                                        <QuestReqItem key={i} title={req} />
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Items */}
                {hasItemReqs && (
                    <>
                        <h3 className="req-subheader" style={{ marginTop: '1.5rem' }}>Required Items</h3>
                        <ul className="item-list">
                            {quest.itemReqs.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </>
                )}

                {hasRecommended && (
                    <>
                        <h3 className="req-subheader" style={{ marginTop: '1rem' }}>Recommended</h3>
                        <ul className="item-list recommended">
                            {quest.recommendedItems.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </>
                )}

                {/* Sub-quests */}
                {subQuests.length > 0 && (
                    <div className="qd-guide-panel" style={{ marginBottom: '1.5rem' }}>
                        <h2 className="qd-section-header" style={{ marginTop: 0 }}>Sub-quests</h2>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {subQuests.map(sq => {
                                const sqDone = completedQuests.has(sq.title);
                                const shortName = sq.title.slice(quest.title.length + 2);
                                return (
                                    <li key={sq.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #333' }}>
                                        <span>
                                            {sqDone && <span style={{ color: '#27ae60', marginRight: '0.25rem' }}>✓</span>}
                                            <span
                                                className="qreq-link"
                                                onClick={() => navigate(`/quests/${encodeURIComponent(sq.title.replace(/ /g, '_'))}`)}
                                            >
                                                {shortName}
                                            </span>
                                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#aaa' }}>({sq.questPoints} QP)</span>
                                        </span>
                                        <button
                                            className={`btn-toggle-main ${sqDone ? 'completed' : ''}`}
                                            onClick={() => toggleQuest(sq.title, !sqDone)}
                                        >
                                            {sqDone ? '✓ Completed' : 'Mark Complete'}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* Quick Guide */}
                <div className="qd-guide-panel">
                    <div className="qd-guide-header">
                        <h2 className="qd-section-header" style={{ marginTop: 0 }}>Quick Guide</h2>
                        <button className="btn-reset" onClick={() => setCheckedSteps(new Set())}>Reset</button>
                    </div>

                    {quest.guide && quest.guide.length > 0 ? (
                        <ol className="guide-list">
                            {quest.guide.map((step, i) => {
                                const isChecked = checkedSteps.has(i);
                                const isObj = typeof step === 'object' && step !== null;
                                const text = isObj ? step.text : step;
                                return (
                                    <li
                                        key={i}
                                        className={`guide-item ${isChecked ? 'done' : ''}`}
                                        onClick={() => toggleStep(i)}
                                    >
                                        <div className="guide-item-content">
                                            <span className="guide-item-text">{text}</span>
                                            {isObj && step.image && (
                                                <img
                                                    src={step.image}
                                                    alt={step.imageAlt || ''}
                                                    className="guide-step-image"
                                                    onClick={e => { e.stopPropagation(); setLightbox({ src: step.image, alt: step.imageAlt || '' }); }}
                                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    ) : (
                        <p className="req-none">No guide data available.</p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default QuestDetails;
