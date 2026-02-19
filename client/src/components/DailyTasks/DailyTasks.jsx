import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { useReportCalls } from '../../context/ReportContext';
import { DAILY_TASKS, WEEKLY_TASKS, MONTHLY_TASKS } from '../../data/common/dailyTasksData';
import './DailyTasks.css';

const DailyTasks = () => {
    const { selectedCharacter, updateCharacterTasks } = useCharacter();
    const { updateReportContext, clearReportContext } = useReportCalls();

    useEffect(() => {
        updateReportContext({
            tool: 'Daily Tasks',
            state: {
                pinned: pinnedTasks.length,
                completed: Object.keys(completedTasks).length
            }
        });
        return () => clearReportContext();
    }, [pinnedTasks, completedTasks]);

    // Clock State
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Pinned & Task State
    const [pinnedTasks, setPinnedTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState({});

    // Load from Selected Character when it changes
    useEffect(() => {
        if (selectedCharacter) {
            try {
                // Parse if string, otherwise assume object (or empty array/obj fallback)
                const pinned = selectedCharacter.pinned_tasks 
                    ? (typeof selectedCharacter.pinned_tasks === 'string' 
                        ? JSON.parse(selectedCharacter.pinned_tasks) 
                        : selectedCharacter.pinned_tasks)
                    : [];

                const tasks = selectedCharacter.task_state 
                    ? (typeof selectedCharacter.task_state === 'string' 
                        ? JSON.parse(selectedCharacter.task_state) 
                        : selectedCharacter.task_state)
                    : {};

                setPinnedTasks(pinned);
                setCompletedTasks(tasks);
            } catch (e) {
                console.error("Failed to parse character tasks", e);
                setPinnedTasks([]);
                setCompletedTasks({});
            }
        }
    }, [selectedCharacter]);

    // Clock Effect
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Save Logic Helper
    const saveToCharacter = (newPinned, newCompleted) => {
        if (selectedCharacter) {
            updateCharacterTasks(selectedCharacter.id, newPinned, newCompleted);
        }
    };


    // Check for Resets (Simplified Version - Dashboard handles proper resets usually, 
    // but we can check simple daily here or rely on the timestamp)
    useEffect(() => {
         // This simple check ensures if we load the page and a reset happened, we might want to visually update.
         // For now, we rely on the user manually resetting or the Dashboard logic clearing it.
         // We'll implement manual reset buttons which clear the timestamp.
    }, []);

    // Format UTC Time
    const formatUTCTime = (date) => {
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const formatUTCDate = (date) => {
        return date.toUTCString().split(' ').slice(0, 4).join(' '); // "Wed, 01 Nov 2023"
    };

    // Toggle Task
    const toggleTask = (taskId) => {
        setCompletedTasks(prev => {
            const newState = { ...prev };
            if (newState[taskId]) {
                delete newState[taskId]; // Uncheck
            } else {
                newState[taskId] = Date.now(); // Check with timestamp
            }
            saveToCharacter(pinnedTasks, newState);
            return newState;
        });
    };

    // Toggle Pin
    const togglePin = (taskId, e) => {
        e.stopPropagation(); // Don't toggle task completion
        setPinnedTasks(prev => {
            let newPinned;
            if (prev.includes(taskId)) {
                newPinned = prev.filter(id => id !== taskId);
            } else {
                newPinned = [...prev, taskId];
            }
            saveToCharacter(newPinned, completedTasks);
            return newPinned;
        });
    };

    // Reset Category
    const resetCategory = (categoryData) => {
        if (window.confirm(`Are you sure you want to reset all ${categoryData[0].category} tasks?`)) {
            const taskIds = categoryData.map(t => t.id);
            setCompletedTasks(prev => {
                const newState = { ...prev };
                taskIds.forEach(id => delete newState[id]);
                saveToCharacter(pinnedTasks, newState);
                return newState;
            });
        }
    };

    const renderTaskSection = (title, tasks) => (
        <div className="task-group">
            <h3>
                {title}
                <button 
                    className="reset-btn" 
                    onClick={() => resetCategory(tasks)}
                >
                    Reset All
                </button>
            </h3>
            <div className="task-grid">
                {tasks.map(task => {
                    const isPinned = pinnedTasks.includes(task.id);
                    return (
                        <div 
                            key={task.id} 
                            className={`task-card ${completedTasks[task.id] ? 'completed' : ''}`}
                            onClick={() => toggleTask(task.id)}
                            title={isPinned ? "Remove from Dashboard" : "Add to Dashboard"}
                        >
                             <button 
                                className={`pin-btn ${isPinned ? 'pinned' : ''}`}
                                onClick={(e) => togglePin(task.id, e)}
                            >
                                {isPinned ? '★' : '☆'}
                            </button>
                            <div className="task-checkbox-container">
                                <input 
                                    type="checkbox" 
                                    className="task-checkbox"
                                    checked={!!completedTasks[task.id]}
                                    onChange={() => {}} // Handled by div click
                                />
                            </div>
                            <div className="task-content">
                                <span className="task-name">{task.name}</span>
                                <span className="task-desc">{task.description}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="daily-tasks-container">
            <div className="daily-header">
                <div>
                    <h2>Daily Tasks Tracker</h2>
                    <p>Track your daily, weekly, and monthly activities. Star items to add them to your Dashboard.</p>
                </div>
                <div className="clock-card">
                    <div className="clock-title">Current Game Time (UTC)</div>
                    <div className="clock-time">{formatUTCTime(currentTime)}</div>
                    <div className="clock-date">{formatUTCDate(currentTime)}</div>
                </div>
            </div>

            <div className="task-sections">
                {renderTaskSection("Daily Tasks (Reset 00:00 UTC)", DAILY_TASKS)}
                {renderTaskSection("Weekly Tasks (Reset Wed 00:00 UTC)", WEEKLY_TASKS)}
                {renderTaskSection("Monthly Tasks (Reset 1st of Month)", MONTHLY_TASKS)}
            </div>
        </div>
    );
};

export default DailyTasks;
