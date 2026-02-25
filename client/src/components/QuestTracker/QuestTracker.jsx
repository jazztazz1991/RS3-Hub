import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacter } from '../../context/CharacterContext';
import { useReportCalls } from '../../context/ReportContext';
import { useQuestLog } from '../../hooks/useQuestLog';
import { QUEST_DATA } from '../../data/quests/questData';
import './QuestTracker.css';

const QuestTracker = () => {
    const navigate = useNavigate();
    const { characterData } = useCharacter();
    const { completedQuests, toggleQuest, importQuests } = useQuestLog();
    const { updateReportContext, clearReportContext } = useReportCalls();

    // Filters
    const [search, setSearch] = useState('');
    const [hideCompleted, setHideCompleted] = useState(false);
    const [filterCanDo, setFilterCanDo] = useState(false);

    // Import State
    const [showImport, setShowImport] = useState(false);
    const [importUser, setImportUser] = useState('');
    const [importMsg, setImportMsg] = useState('');

    // --- Helpers ---

    // Convert character stats array to object for O(1) lookup
    const statsMap = useMemo(() => {
        if (!characterData) return {};
        const map = {};
        characterData.forEach(s => {
            map[s.name] = s.level; // Using virtual level? Assuming data has .level
        });
        return map;
    }, [characterData]);

    const checkRequirements = (quest) => {
        const missing = [];

        // Check skill requirements
        if (quest.skillReqs) {
            quest.skillReqs.forEach(req => {
                const myLevel = statsMap[req.skill] || 0;
                if (myLevel < req.level) {
                    missing.push(req);
                }
            });
        }

        // Check quest prerequisites
        if (quest.questReqs) {
            quest.questReqs.forEach(qTitle => {
                if (!completedQuests.has(qTitle)) {
                    missing.push({ skill: 'Quest', level: qTitle });
                }
            });
        }

        return {
            met: missing.length === 0,
            missing
        };
    };

    // Process Data
    const filteredQuests = useMemo(() => {
        return QUEST_DATA.filter(q => {
            // Text Search
            if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false;
            
            // Hide Completed
            const isDone = completedQuests.has(q.title);
            if (hideCompleted && isDone) return false;

            // Can Do Filter
            if (filterCanDo) {
                // If already done, we ignore "can do" logic (show it? or hide it?)
                // Usually "Can Do" implies "Available to Start"
                if (isDone) return false; // Don't show completed in "Can Do"
                const check = checkRequirements(q);
                if (!check.met) return false;
            }

            return true;
        });
    }, [search, hideCompleted, filterCanDo, completedQuests, statsMap]); // re-calc when inputs change

    // Calc Totals — only count/sum quests that exist in QUEST_DATA
    // (RuneMetrics import may include titles that don't match our data)
    const { totalQP, completedCount } = useMemo(() => {
        let qp = 0;
        let count = 0;
        completedQuests.forEach(title => {
            const q = QUEST_DATA.find(x => x.title === title);
            if (q) {
                qp += q.questPoints;
                count++;
            }
        });
        return { totalQP: qp, completedCount: count };
    }, [completedQuests]);
useEffect(() => {
        updateReportContext({
            tool: 'Quest Tracker',
            state: {
                search,
                hideCompleted,
                filterCanDo,
                completedCount: completedQuests.size,
                totalQP
            }
        });
        return () => clearReportContext();
    }, [search, hideCompleted, filterCanDo, completedQuests, totalQP]);

    
    const handleImport = async () => {
        if (!importUser) return;
        setImportMsg("Importing...");
        try {
            const res = await importQuests(importUser);
            setImportMsg(res.message);
            setTimeout(() => setShowImport(false), 2000);
        } catch (e) {
            setImportMsg("Failed: " + (e.response?.data?.message || e.message));
        }
    };

    return (
        <div className="quest-tracker">
            <h2>Quest Tracker</h2>

            {/* Summary Stats */}
            <div className="qt-summary">
                <div className="stat-box">
                    <span className="count">{completedCount} / {QUEST_DATA.length}</span>
                    <span className="label">Quests Completed</span>
                </div>
                <div className="stat-box">
                    <span className="count">{totalQP}</span>
                    <span className="label">Quest Points</span>
                </div>
            </div>

            {/* Controls */}
            <div className="qt-tools">
                <input 
                    type="text" 
                    className="qt-search" 
                    placeholder="Search quests..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                
                <div className="qt-filter-group">
                    <button 
                        className={`qt-filter-btn ${hideCompleted ? 'active' : ''}`}
                        onClick={() => setHideCompleted(!hideCompleted)}
                    >
                        Hide Completed
                    </button>
                    <button 
                        className={`qt-filter-btn ${filterCanDo ? 'active' : ''}`}
                        onClick={() => setFilterCanDo(!filterCanDo)}
                    >
                        Can Do Only
                    </button>
                </div>

                <div className="qt-import-section">
                    <button className="btn-import" onClick={() => setShowImport(!showImport)}>
                        Sync from RuneMetrics
                    </button>
                </div>
            </div>

            {/* Import Modal Area */}
            {showImport && (
                <div className="card" style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #27ae60' }}>
                    <h4>Sync Completed Quests</h4>
                    <p style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '0.5rem' }}>
                        Enter your RuneScape username. Your RuneMetrics profile <strong>must</strong> be set to Public.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                            type="text" 
                            style={{ flex: 1, padding: '0.5rem' }} 
                            placeholder="Username"
                            value={importUser}
                            onChange={e => setImportUser(e.target.value)}
                        />
                        <button className="btn-import" onClick={handleImport}>Sync</button>
                    </div>
                    {importMsg && <p style={{ marginTop: '0.5rem', color: '#f1c40f' }}>{importMsg}</p>}
                </div>
            )}

            {/* Quest Table */}
            <div className="qt-table-wrapper">
                <table className="qt-table">
                    <thead>
                        <tr>
                            <th className="qt-col-status" title="Availability status"></th>
                            <th className="qt-col-name">Quest</th>
                            <th className="qt-col-diff">Difficulty</th>
                            <th className="qt-col-length">Length</th>
                            <th className="qt-col-type">Type</th>
                            <th className="qt-col-action"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredQuests.map(q => {
                            const isCompleted = completedQuests.has(q.title);
                            const { met } = checkRequirements(q);
                            const rowClass = isCompleted ? 'row-completed' : (met ? 'row-can-do' : 'row-cannot-do');

                            return (
                                <tr
                                    key={q.title}
                                    className={rowClass}
                                    onClick={() => navigate(`/quests/${encodeURIComponent(q.title.replace(/ /g, '_'))}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td className="qt-col-status">
                                        <span
                                            className={`status-dot ${isCompleted ? 'dot-done' : (met ? 'dot-can' : 'dot-cant')}`}
                                            title={isCompleted ? 'Completed' : (met ? 'Requirements met' : 'Missing requirements')}
                                        />
                                    </td>
                                    <td className="qt-col-name qt-quest-name">{q.title}</td>
                                    <td className="qt-col-diff">{q.difficulty}</td>
                                    <td className="qt-col-length">{q.length}</td>
                                    <td className="qt-col-type">
                                        <span className={`tag ${q.isMembers ? 'members' : 'f2p'}`}>
                                            {q.isMembers ? 'M' : 'F2P'}
                                        </span>
                                    </td>
                                    <td className="qt-col-action" onClick={e => e.stopPropagation()}>
                                        <button
                                            className={`btn-toggle ${isCompleted ? 'done' : ''}`}
                                            onClick={() => toggleQuest(q.title, !isCompleted)}
                                        >
                                            {isCompleted ? '✓' : 'Done'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredQuests.length === 0 && (
                    <div className="qc-empty-state">
                        <h4>No quests found</h4>
                        <p>Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestTracker;
