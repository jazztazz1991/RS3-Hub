import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added useCallback
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter } from '../../context/CharacterContext';
import { useQuestLog } from '../../hooks/useQuestLog';
import { QUEST_DATA } from '../../data/quests/questData';
import QuestNode from './QuestNode'; // Import new component
import './QuestDetails.css';

const QuestDetails = () => {
    const { questTitle } = useParams();
    const navigate = useNavigate();
    const { characterData } = useCharacter();
    const { completedQuests, toggleQuest } = useQuestLog();
    
    // Find quest data 
    const quest = useMemo(() => {
        const decodedTitle = decodeURIComponent(questTitle).replace(/_/g, ' ');
        // Case insensitive match
        return QUEST_DATA.find(q => q.title.toLowerCase() === decodedTitle.toLowerCase());
    }, [questTitle]);

    // Local state for guide checklist 
    const [checkedSteps, setCheckedSteps] = useState(() => {
        if (!quest) return new Set();
        const saved = localStorage.getItem(`quest_progress_${quest.title}`); // Use quest.title key
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Helper to get parents for the recursive tree
    // Ideally memoized or outside component, but inside is fine for now
    const getQuestParents = useCallback((title) => {
        const q = QUEST_DATA.find(x => x.title === title);
        if (!q || !q.questReqs) return [];
        return q.questReqs;
    }, []);

    useEffect(() => {
        if (quest && checkedSteps.size >= 0) { // allow 0
            localStorage.setItem(`quest_progress_${quest.title}`, JSON.stringify([...checkedSteps]));
        }
    }, [checkedSteps, quest]);

    if (!quest) {
        return <div className="quest-details-container"><h2>Quest not found</h2><button onClick={() => navigate('/quests')}>Back to Tracker</button></div>;
    }

    const isCompleted = completedQuests.has(quest.title);

    // Stats lookup
    const statsMap = useMemo(() => {
        if (!characterData) return {};
        const map = {};
        characterData.forEach(s => {
            map[s.name] = s.level;
        });
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

    return (
        <div className="quest-details-container">
            <button className="btn-back" onClick={() => navigate('/quests')}>← Back to Tracker</button>

            {/* Wiki Style Header */}
            <div className="qd-page-title">
                <h1>{quest.title}</h1>
                <div className="qd-actions">
                    <a 
                        href={`https://runescape.wiki/w/${quest.title.replace(/ /g, '_')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-wiki"
                        style={{ marginRight: '1rem' }}
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

            {/* Right Side Infobox */}
            <aside className="qd-infobox">
                <div className="qd-infobox-header">{quest.title}</div>
                <table className="qd-infobox-table">
                    <tbody>
                        <tr>
                            <th>Start point</th>
                            <td>See Guide</td>
                        </tr>
                        <tr>
                            <th>Members</th>
                            <td>{quest.isMembers ? 'Yes' : 'No'}</td>
                        </tr>
                        <tr>
                            <th>Length</th>
                            <td>{quest.length}</td>
                        </tr>
                        <tr>
                            <th>Difficulty</th>
                            <td>{quest.difficulty}</td>
                        </tr>
                        <tr>
                            <th>Series</th>
                            <td>{quest.series || '-'}</td>
                        </tr>
                        <tr>
                            <th>Points</th>
                            <td>{quest.questPoints}</td>
                        </tr>
                        <tr>
                            <th>Release Date</th>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>
            </aside>

            {/* Main Body */}
            <div className="qd-main-body">
                
                {/* Requirements Tree Section */}
                <h2 className="qd-section-header">Requirements</h2>
                <div className="req-tree-container">
                    <ul className="req-tree-root">
                        {(quest.questReqs && quest.questReqs.length > 0) ? (
                            quest.questReqs.map((req, i) => (
                                <QuestNode 
                                    key={i} 
                                    title={req} 
                                    completedQuests={completedQuests} 
                                    getQuestParents={getQuestParents}
                                    getQuestTitle={t => t}
                                />
                            ))
                        ) : (
                            <li style={{color: '#7f8c8d', fontStyle: 'italic'}}>No quest requirements</li>
                        )}
                    </ul>

                    {/* Skill Reqs */}
                    <div style={{ marginTop: '1.5rem' }}>
                        {quest.skillReqs?.map((req, i) => {
                             const myLvl = statsMap[req.skill] || 0;
                             const met = myLvl >= req.level;
                             return (
                                <div key={i} className="skill-req-row">
                                    <span className={`status-icon ${met ? 'status-met' : 'status-missing'}`}>
                                        {met ? '●' : '●'} {/* Using dot or distinctive marker */}
                                    </span>
                                    <span className="skill-level">{req.level}</span>
                                    <span className="skill-name">{req.skill}</span>
                                    {met && <span className="status-met">✓</span>}
                                </div>
                             )
                        })}
                        {(!quest.skillReqs || quest.skillReqs.length === 0) && (
                            <div style={{color: '#7f8c8d'}}>No skill requirements</div>
                        )}
                    </div>
                </div>

                {/* Items Section */}
                {quest.itemReqs && quest.itemReqs.length > 0 && (
                    <>
                        <h2 className="qd-section-header">Required Items</h2>
                        <div className="item-req-list">
                            {quest.itemReqs.map((item, idx) => (
                                <div key={idx} className="item-req-row">
                                    <span className="item-bullet">•</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {quest.recommendedItems && quest.recommendedItems.length > 0 && (
                    <>
                        <h2 className="qd-section-header">Recommended Items</h2>
                        <div className="item-req-list">
                            {quest.recommendedItems.map((item, idx) => (
                                <div key={idx} className="item-req-row">
                                    <span className="item-bullet">•</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Guide Section */}
                <div className="qd-guide-panel" style={{ marginTop: '2rem', border: 'none', padding: 0, background: 'none' }}>
                    <div className="guide-header" style={{ borderColor: '#233140' }}>
                        <h3 style={{ color: '#5dade2' }}>Quick Guide</h3>
                        <button className="btn-reset" onClick={() => setCheckedSteps(new Set())}>Reset</button>
                    </div>
                    
                    {quest.guide && quest.guide.length > 0 ? (
                        <div className="guide-steps">
                            {quest.guide.map((step, i) => {
                                const isChecked = checkedSteps.has(i);
                                return (
                                    <div 
                                        key={i} 
                                        className={`guide-step-row ${isChecked ? 'done' : ''}`}
                                        onClick={() => toggleStep(i)}
                                    >
                                        <div className="guide-checkbox">
                                            {isChecked && '✓'}
                                        </div>
                                        <div className="guide-text">
                                            {step}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-guide">
                            <p>No quick guide data available.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestDetails;
