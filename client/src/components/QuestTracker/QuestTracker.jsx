import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacter } from '../../context/CharacterContext';
import { useQuestLog } from '../../hooks/useQuestLog';
import { QUEST_DATA } from '../../data/questData';
import './QuestTracker.css';

const QuestTracker = () => {
    const navigate = useNavigate();
    const { characterData } = useCharacter();
    const { completedQuests, toggleQuest, importQuests } = useQuestLog();

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
        if (!quest.skillReqs || quest.skillReqs.length === 0) return { met: true, missing: [] };
        
        const missing = [];
        quest.skillReqs.forEach(req => {
            const myLevel = statsMap[req.skill] || 0;
            if (myLevel < req.level) {
                missing.push(req);
            }
        });

        // Check quest reqs (simplified: check if title is in completedQuests)
        // (Note: questData might list prerequisite quests strings)
        if (quest.questReqs) {
            quest.questReqs.forEach(qTitle => {
                if (!completedQuests.has(qTitle)) {
                    missing.push({ skill: "Quest", level: qTitle }); // Hacky representation
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

    // Calc Totals
    const totalQP = useMemo(() => {
        let sum = 0;
        completedQuests.forEach(title => {
            const q = QUEST_DATA.find(x => x.title === title);
            if (q) sum += q.questPoints;
        });
        return sum;
    }, [completedQuests]);

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
                    <span className="count">{completedQuests.size} / {QUEST_DATA.length}</span>
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

            {/* Quest Grid */}
            <div className="qt-list">
                {filteredQuests.map(q => {
                    const isCompleted = completedQuests.has(q.title);
                    const { met, missing } = checkRequirements(q);
                    const statusClass = isCompleted ? 'completed' : (met ? 'can-do' : 'cannot-do');

                    return (
                        <div key={q.title} className={`quest-card ${statusClass}`}>
                            <div className="qc-header">
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                    <button 
                                        className="btn-details" 
                                        onClick={() => navigate(`/quests/${encodeURIComponent(q.title.replace(/ /g, '_'))}`)}
                                        title="Open Guide"
                                    >
                                        Details →
                                    </button>
                                    <span 
                                        className="qc-title"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/quests/${encodeURIComponent(q.title.replace(/ /g, '_'))}`)}
                                    >
                                        {q.title}
                                    </span>
                                    <a 
                                        href={`https://runescape.wiki/w/${q.title.replace(/ /g, '_')}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="qc-wiki-link"
                                    >
                                        Wiki ↗
                                    </a>
                                </div>
                                <button 
                                    className="btn-toggle"
                                    onClick={() => toggleQuest(q.title, !isCompleted)}
                                >
                                    {isCompleted ? '✓ Done' : 'Mark Done'}
                                </button>
                            </div>

                            <div className="qc-meta">
                                <span className={`tag ${q.members ? 'members' : 'f2p'}`}>
                                    {q.members ? 'Members' : 'Free'}
                                </span>
                                <span className="tag">{q.difficulty}</span>
                                <span className="tag">{q.length}</span>
                                {q.series && <span className="tag">{q.series}</span>}
                            </div>

                            {/* Requirements Display */}
                            {!isCompleted && (q.skillReqs?.length > 0 || q.questReqs?.length > 0) && (
                                <div className="qc-reqs">
                                    <strong>Requirements:</strong>
                                    {q.skillReqs?.map((req, i) => {
                                        const myLvl = statsMap[req.skill] || 0;
                                        const isMet = myLvl >= req.level;
                                        return (
                                            <span 
                                                key={i} 
                                                className={`req-item ${isMet ? 'met' : 'missing'}`}
                                            >
                                                {isMet ? '✓' : '✗'} {req.level} {req.skill}
                                            </span>
                                        );
                                    })}
                                    {q.questReqs?.map((reqTitle, i) => {
                                        const isMet = completedQuests.has(reqTitle);
                                        return (
                                            <span 
                                                key={`q-${i}`} 
                                                className={`req-item ${isMet ? 'met' : 'missing'}`}
                                            >
                                                {isMet ? '✓' : '✗'} Quest: {reqTitle}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Guide Display removed - Moved to details page */}
                        </div>
                    );
                })}
                
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
