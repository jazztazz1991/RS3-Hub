import React, { useState, useEffect } from 'react';
import { useSlayerLog } from '../../../hooks/useSlayerLog';
import { SLAYER_MASTERS, SLAYER_MONSTERS } from '../../../data/slayerData';
import './SlayerLog.css';

const SlayerLog = ({ onStatsUpdate }) => {
    const { 
        activeTask, 
        history, 
        startTask, 
        stopTask, 
        resumeTask, 
        completeTask, 
        cancelTask, 
        deleteTask, // Added delete function
        getStatsForMonster 
    } = useSlayerLog();

    // Setup Form State
    const [selectedMaster, setSelectedMaster] = useState(SLAYER_MASTERS[0].id);
    const [selectedMonsterId, setSelectedMonsterId] = useState('');
    const [taskCount, setTaskCount] = useState(100);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Complete Form State
    const [completionNotes, setCompletionNotes] = useState('');
    const [actualCount, setActualCount] = useState(0);

    // Timer State for UI updates
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let interval;
        if (activeTask?.isRunning) {
            interval = setInterval(() => {
                const now = Date.now();
                setElapsedTime(activeTask.accumulatedTime + (now - activeTask.lastTick));
            }, 1000);
        } else if (activeTask) {
            setElapsedTime(activeTask.accumulatedTime);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [activeTask]);

    // Initialize completion count from active task
    useEffect(() => {
        if (activeTask) {
            setActualCount(activeTask.assignedCount);
        }
    }, [activeTask]);

    const formatTime = (ms) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)));
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    const handleStart = () => {
        if (!selectedMonsterId) return;
        const monster = SLAYER_MONSTERS.find(m => m.id === selectedMonsterId);
        const master = SLAYER_MASTERS.find(m => m.id === selectedMaster);
        startTask(monster, taskCount, master);
    };

    const handleComplete = () => {
        completeTask(actualCount, completionNotes);
        setCompletionNotes('');
    };

    const filteredMonsters = SLAYER_MONSTERS.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="slayer-log-container">
            <h3>Slayer Log</h3>
            
            {!activeTask ? (
                <div className="log-setup card">
                    <h4>New Task</h4>
                    <div className="form-group">
                        <label>Slayer Master</label>
                        <select 
                            value={selectedMaster} 
                            onChange={(e) => setSelectedMaster(e.target.value)}
                        >
                            {SLAYER_MASTERS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Monster</label>
                        <input 
                            type="text" 
                            placeholder="Search monster..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="monster-search"
                        />
                        <select 
                            value={selectedMonsterId} 
                            onChange={(e) => setSelectedMonsterId(e.target.value)}
                            size="5"
                            className="monster-select"
                        >
                            {filteredMonsters.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} (Lvl {m.level})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Assigned Count</label>
                        <input 
                            type="number" 
                            value={taskCount} 
                            onChange={(e) => setTaskCount(e.target.value)}
                            min="1"
                        />
                    </div>

                    <button 
                        className="btn-primary start-btn"
                        disabled={!selectedMonsterId}
                        onClick={handleStart}
                    >
                        Start Task Timer
                    </button>
                </div>
            ) : (
                <div className="active-task-panel card">
                    <div className="task-header">
                        <h4>Current Task: {activeTask.monster.name}</h4>
                        <span className="task-master">{activeTask.master?.name}</span>
                    </div>
                    
                    <div className="timer-display">
                        {formatTime(elapsedTime)}
                    </div>
                    
                    <div className="task-assigned">
                        Goal: {activeTask.assignedCount} kills
                    </div>

                    <div className="task-controls">
                        {activeTask.isRunning ? (
                            <button className="btn-secondary" onClick={stopTask}>Pause</button>
                        ) : (
                            <button className="btn-primary" onClick={resumeTask}>Resume</button>
                        )}
                        <button className="btn-danger" onClick={cancelTask}>Cancel</button>
                    </div>

                    <div className="completion-form">
                        <h5>Complete Task</h5>
                        <div className="form-row">
                            <label>Actual Kills:</label>
                            <input 
                                type="number" 
                                value={actualCount} 
                                onChange={(e) => setActualCount(e.target.value)} 
                            />
                        </div>
                        <div className="form-row">
                            <label>Notes:</label>
                            <textarea 
                                value={completionNotes} 
                                onChange={(e) => setCompletionNotes(e.target.value)}
                                placeholder="Drops, method used, etc."
                            />
                        </div>
                        <button className="btn-success" onClick={handleComplete}>
                            Finish & Log
                        </button>
                    </div>
                </div>
            )}

            <div className="task-history card">
                <h4>Recent History</h4>
                {history.length === 0 ? (
                    <p className="no-data">No completed tasks yet.</p>
                ) : (
                    <div className="history-list">
                        {history.slice(0, 10).map(entry => (
                            <div key={entry.id} className="history-item">
                                <div className="history-info-wrapper">
                                    <div className="history-main">
                                        <span className="h-monster">{entry.monsterName}</span>
                                        <span className="h-count">{entry.count} kills</span>
                                    </div>
                                    <div className="history-meta">
                                        <span className="h-time">{formatTime(entry.duration)}</span>
                                        <span className="h-xp">
                                            {entry.duration > 0 ? Math.round((entry.count / (entry.duration/3600000))).toLocaleString() : 0} kills/hr
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    className="btn-delete" 
                                    onClick={() => {
                                        if(window.confirm('Delete this log entry?')) deleteTask(entry.id);
                                    }}
                                    title="Delete Entry"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SlayerLog;
