import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import { useReportCalls } from '../../context/ReportContext';
import { useQuestLog } from '../../hooks/useQuestLog';
import { QUEST_DATA } from '../../data/quests/questData';
import LoginBanner from '../Common/LoginBanner';
import './QuestTracker.css';

const QuestTracker = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { characterData } = useCharacter();
    const { completedQuests, toggleQuest, importQuests } = useQuestLog();
    const { updateReportContext, clearReportContext } = useReportCalls();

    // Filters
    const [search, setSearch] = useState('');
    const [hideCompleted, setHideCompleted] = useState(false);
    const [filterCanDo, setFilterCanDo] = useState(false);

    // Sorting
    const [sortCol, setSortCol] = useState('name');
    const [sortAsc, setSortAsc] = useState(true);
    const [groupBySeries, setGroupBySeries] = useState(false);

    // Import State
    const [showImport, setShowImport] = useState(false);
    const [importUser, setImportUser] = useState('');
    const [importMsg, setImportMsg] = useState('');

    // --- Helpers ---

    // Sort key: strip leading articles/punctuation to match RS3 wiki ordering
    const sortKey = (title) => title.replace(/^(A |An |The |')/i, '').toLowerCase();

    const handleSort = (col) => {
        if (sortCol === col) setSortAsc(!sortAsc);
        else { setSortCol(col); setSortAsc(true); }
    };

    const DIFF_ORDER = { 'Novice': 0, 'Intermediate': 1, 'Experienced': 2, 'Master': 3, 'Grandmaster': 4, 'Special': 5 };
    const LENGTH_ORDER = { 'Very Short': 0, 'Short': 1, 'Medium': 2, 'Long': 3, 'Very Long': 4 };

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
            // Exclude sub-quests (shown inside parent quest detail pages instead)
            if (q.title.includes(': ')) return false;

            // Text Search — also match against article-stripped title
            if (search) {
                const term = search.toLowerCase();
                const title = q.title.toLowerCase();
                if (!title.includes(term) && !sortKey(q.title).includes(term)) return false;
            }
            
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
        }).sort((a, b) => {
            let cmp = 0;
            switch (sortCol) {
                case 'diff':
                    cmp = (DIFF_ORDER[a.difficulty] ?? 99) - (DIFF_ORDER[b.difficulty] ?? 99);
                    break;
                case 'length':
                    cmp = (LENGTH_ORDER[a.length] ?? 99) - (LENGTH_ORDER[b.length] ?? 99);
                    break;
                case 'qp':
                    cmp = a.questPoints - b.questPoints;
                    break;
                case 'type':
                    cmp = (a.isMembers === b.isMembers) ? 0 : (a.isMembers ? 1 : -1);
                    break;
                default:
                    cmp = sortKey(a.title).localeCompare(sortKey(b.title));
            }
            if (cmp === 0 && sortCol !== 'name') cmp = sortKey(a.title).localeCompare(sortKey(b.title));
            return sortAsc ? cmp : -cmp;
        });
    }, [search, hideCompleted, filterCanDo, completedQuests, statsMap, sortCol, sortAsc]);

    // Group by series
    const questsBySeries = useMemo(() => {
        if (!groupBySeries) return null;
        const groups = {};
        filteredQuests.forEach(q => {
            const series = q.series || 'N/A';
            if (!groups[series]) groups[series] = [];
            groups[series].push(q);
        });
        return Object.entries(groups)
            .sort(([a], [b]) => {
                if (a === 'N/A') return 1;
                if (b === 'N/A') return -1;
                return a.localeCompare(b);
            });
    }, [filteredQuests, groupBySeries]);

    // Calc Totals — only count/sum quests that exist in QUEST_DATA
    // (RuneMetrics import may include titles that don't match our data)
    // Sub-quests (title contains ': ') count toward QP but not quest count
    const mainQuestCount = QUEST_DATA.filter(q => !q.title.includes(': ')).length;
    const maxQP = useMemo(() => QUEST_DATA.reduce((sum, q) => sum + q.questPoints, 0), []);
    const { totalQP, completedCount } = useMemo(() => {
        let qp = 0;
        let count = 0;
        completedQuests.forEach(title => {
            const q = QUEST_DATA.find(x => x.title === title);
            if (q) {
                qp += q.questPoints;
                if (!title.includes(': ')) count++;
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
    }, [search, hideCompleted, filterCanDo, completedQuests, totalQP, updateReportContext, clearReportContext]);

    
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

            {!user && <LoginBanner features="track quest completion, import progress from RuneMetrics, and check skill requirements against your character" />}

            {/* Summary Stats */}
            <div className="qt-summary">
                <div className="stat-box">
                    <span className="count">{completedCount} / {mainQuestCount}</span>
                    <span className="label">Quests Completed</span>
                </div>
                <div className="stat-box">
                    <span className="count">{totalQP} / {maxQP}</span>
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
                    {user && <button
                        className={`qt-filter-btn ${hideCompleted ? 'active' : ''}`}
                        onClick={() => setHideCompleted(!hideCompleted)}
                    >
                        Hide Completed
                    </button>}
                    {user && <button
                        className={`qt-filter-btn ${filterCanDo ? 'active' : ''}`}
                        onClick={() => setFilterCanDo(!filterCanDo)}
                    >
                        Can Do Only
                    </button>}
                    <button
                        className={`qt-filter-btn ${groupBySeries ? 'active' : ''}`}
                        onClick={() => setGroupBySeries(!groupBySeries)}
                    >
                        Group by Series
                    </button>
                </div>

                {user && <div className="qt-import-section">
                    <button className="btn-import" onClick={() => setShowImport(!showImport)}>
                        Sync from RuneMetrics
                    </button>
                </div>}
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
                            <th className="qt-col-name qt-sortable" onClick={() => handleSort('name')}>
                                Quest {sortCol === 'name' && <span className="sort-arrow">{sortAsc ? '▲' : '▼'}</span>}
                            </th>
                            <th className="qt-col-diff qt-sortable" onClick={() => handleSort('diff')}>
                                Difficulty {sortCol === 'diff' && <span className="sort-arrow">{sortAsc ? '▲' : '▼'}</span>}
                            </th>
                            <th className="qt-col-length qt-sortable" onClick={() => handleSort('length')}>
                                Length {sortCol === 'length' && <span className="sort-arrow">{sortAsc ? '▲' : '▼'}</span>}
                            </th>
                            <th className="qt-col-qp qt-sortable" onClick={() => handleSort('qp')}>
                                QP {sortCol === 'qp' && <span className="sort-arrow">{sortAsc ? '▲' : '▼'}</span>}
                            </th>
                            <th className="qt-col-type qt-sortable" onClick={() => handleSort('type')}>
                                Type {sortCol === 'type' && <span className="sort-arrow">{sortAsc ? '▲' : '▼'}</span>}
                            </th>
                            {user && <th className="qt-col-action"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {groupBySeries && questsBySeries ? (
                            questsBySeries.map(([series, quests]) => (
                                <React.Fragment key={series}>
                                    <tr className="series-header-row">
                                        <td colSpan={user ? 7 : 6}>
                                            <span className="series-name">{series === 'N/A' ? 'Standalone Quests' : series}</span>
                                            <span className="series-count">{quests.filter(q => completedQuests.has(q.title)).length}/{quests.length}</span>
                                        </td>
                                    </tr>
                                    {quests.map(q => {
                                        const isCompleted = completedQuests.has(q.title);
                                        const { met } = checkRequirements(q);
                                        const rowClass = isCompleted ? 'row-completed' : (met ? 'row-can-do' : 'row-cannot-do');
                                        return (
                                            <tr key={q.title} className={rowClass}
                                                onClick={() => navigate(`/quests/${encodeURIComponent(q.title.replace(/ /g, '_'))}`)}
                                                style={{ cursor: 'pointer' }}>
                                                <td className="qt-col-status">
                                                    <span className={`status-dot ${isCompleted ? 'dot-done' : (met ? 'dot-can' : 'dot-cant')}`}
                                                        title={isCompleted ? 'Completed' : (met ? 'Requirements met' : 'Missing requirements')} />
                                                </td>
                                                <td className="qt-col-name qt-quest-name">{q.title}</td>
                                                <td className="qt-col-diff">{q.difficulty}</td>
                                                <td className="qt-col-length">{q.length}</td>
                                                <td className="qt-col-qp">{q.questPoints}</td>
                                                <td className="qt-col-type">
                                                    <span className={`tag ${q.isMembers ? 'members' : 'f2p'}`}>{q.isMembers ? 'M' : 'F2P'}</span>
                                                </td>
                                                {user && <td className="qt-col-action" onClick={e => e.stopPropagation()}>
                                                    <button className={`btn-toggle ${isCompleted ? 'done' : ''}`}
                                                        onClick={() => toggleQuest(q.title, !isCompleted)}>
                                                        {isCompleted ? '✓' : 'Done'}
                                                    </button>
                                                </td>}
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))
                        ) : (
                            filteredQuests.map(q => {
                                const isCompleted = completedQuests.has(q.title);
                                const { met } = checkRequirements(q);
                                const rowClass = isCompleted ? 'row-completed' : (met ? 'row-can-do' : 'row-cannot-do');
                                return (
                                    <tr key={q.title} className={rowClass}
                                        onClick={() => navigate(`/quests/${encodeURIComponent(q.title.replace(/ /g, '_'))}`)}
                                        style={{ cursor: 'pointer' }}>
                                        <td className="qt-col-status">
                                            <span className={`status-dot ${isCompleted ? 'dot-done' : (met ? 'dot-can' : 'dot-cant')}`}
                                                title={isCompleted ? 'Completed' : (met ? 'Requirements met' : 'Missing requirements')} />
                                        </td>
                                        <td className="qt-col-name qt-quest-name">{q.title}</td>
                                        <td className="qt-col-diff">{q.difficulty}</td>
                                        <td className="qt-col-length">{q.length}</td>
                                        <td className="qt-col-qp">{q.questPoints}</td>
                                        <td className="qt-col-type">
                                            <span className={`tag ${q.isMembers ? 'members' : 'f2p'}`}>{q.isMembers ? 'M' : 'F2P'}</span>
                                        </td>
                                        {user && <td className="qt-col-action" onClick={e => e.stopPropagation()}>
                                            <button className={`btn-toggle ${isCompleted ? 'done' : ''}`}
                                                onClick={() => toggleQuest(q.title, !isCompleted)}>
                                                {isCompleted ? '✓' : 'Done'}
                                            </button>
                                        </td>}
                                    </tr>
                                );
                            })
                        )}
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
