import React, { useState, useEffect } from 'react';
import './TaskTracker.css';

const TaskTracker = ({ characterName }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Task Definitions
    const TASKS = {
        daily: [
            { id: 'slime_gathering', label: 'Gather Slime' }
        ],
        weekly: [
            { id: 'tears_of_guthix', label: 'Tears of Guthix' }
        ],
        monthly: [
            { id: 'giant_oyster', label: 'Giant Oyster' }
        ]
    };

    // State for completed tasks
    // Structure: { "slime_gathering": timestamp, ... }
    const [completedTasks, setCompletedTasks] = useState({});

    // 1. Clock Timer
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. Load Tasks on Mount or Character Change
    useEffect(() => {
        if (!characterName) return;
        const saved = localStorage.getItem(`rs3hub_tasks_${characterName}`);
        if (saved) {
            setCompletedTasks(JSON.parse(saved));
        } else {
            setCompletedTasks({});
        }
    }, [characterName]);

    // 3. Reset Logic Validator (Runs every second roughly to uncheck items if reset time passed)
    useEffect(() => {
        if (!characterName) return;

        const checkResets = () => {
            const now = new Date();
            let hasChanges = false;
            const newTasks = { ...completedTasks };

            // Helper: Get UTC Date components
            const getUTC = (d) => ({
                year: d.getUTCFullYear(),
                month: d.getUTCMonth(),
                date: d.getUTCDate(),
                day: d.getUTCDay(),       // 0=Sun, 1=Mon, ..., 6=Sat
                hours: d.getUTCHours()
            });

            // --- DAILY RESET CHECK ---
            // Reset happens at 00:00 UTC Daily
            // If task timestamp < Today 00:00 UTC, reset it.
            const nowUTC = getUTC(now);
            const lastDailyReset = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 0, 0, 0)); // Today 00:00 UTC

            TASKS.daily.forEach(task => {
                const completedAt = newTasks[task.id];
                if (completedAt && completedAt < lastDailyReset.getTime()) {
                    delete newTasks[task.id];
                    hasChanges = true;
                }
            });

            // --- WEEKLY RESET CHECK ---
            // Reset happens Wednesday 00:00 UTC (Tuesday night in US)
            // We need to find the "Most Recent Wednesday 00:00 UTC"
            // JS Day: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
            // If today is Wed (3) and hour >= 0, then Last Reset = Today 00:00
            // If today is Thu-Sat (4-6) or Sun-Tue (0-2), we adjust accordingly.
            
            let daysSinceWed = nowUTC.day - 3; 
            if (daysSinceWed < 0) daysSinceWed += 7; // e.g. Mon(1) - 3 = -2 => +7 = 5 days since Wed

            // However, be careful. If today is Wed 00:00:01, daysSinceWed is 0. 
            // Last reset was milliseconds ago. 
            const lastWeeklyReset = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date - daysSinceWed, 0, 0, 0));

            TASKS.weekly.forEach(task => {
                const completedAt = newTasks[task.id];
                if (completedAt && completedAt < lastWeeklyReset.getTime()) {
                    delete newTasks[task.id];
                    hasChanges = true;
                }
            });

            // --- MONTHLY RESET CHECK ---
            // Reset happens 1st of Month 00:00 UTC
            const lastMonthlyReset = new Date(Date.UTC(nowUTC.year, nowUTC.month, 1, 0, 0, 0)); // 1st of current month

            TASKS.monthly.forEach(task => {
                const completedAt = newTasks[task.id];
                if (completedAt && completedAt < lastMonthlyReset.getTime()) {
                    delete newTasks[task.id];
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                setCompletedTasks(newTasks);
                localStorage.setItem(`rs3hub_tasks_${characterName}`, JSON.stringify(newTasks));
            }
        };

        checkResets(); // Check on mount/update
        const interval = setInterval(checkResets, 60000); // Check every minute
        return () => clearInterval(interval);

    }, [characterName, completedTasks]);

    // Handle Toggle
    const toggleTask = (taskId) => {
        if (!characterName) return;

        const newTasks = { ...completedTasks };
        
        if (newTasks[taskId]) {
            // Uncheck (remove)
            delete newTasks[taskId];
        } else {
            // Check (add timestamp)
            newTasks[taskId] = Date.now();
        }

        setCompletedTasks(newTasks);
        localStorage.setItem(`rs3hub_tasks_${characterName}`, JSON.stringify(newTasks));
    };

    if (!characterName) return null;

    return (
        <div className="task-tracker">
            <div className="tracker-header">
                <h2>Task Tracker</h2>
                <div className="clock-display">
                    <div>Local: {currentTime.toLocaleTimeString()}</div>
                    <div>UTC: {currentTime.toLocaleTimeString('en-US', { timeZone: 'UTC' })}</div>
                </div>
            </div>

            <div className="tasks-grid">
                
                {/* Daily Column */}
                <div className="task-section">
                    <h3>
                        Daily
                        <span className="reset-info">Resets 00:00 UTC</span>
                    </h3>
                    {TASKS.daily.map(task => (
                        <div 
                            key={task.id} 
                            className={`task-item ${completedTasks[task.id] ? 'completed' : ''}`}
                            onClick={() => toggleTask(task.id)}
                        >
                            <input 
                                type="checkbox" 
                                className="task-checkbox"
                                checked={!!completedTasks[task.id]}
                                readOnly
                            />
                            <span className="task-label">{task.label}</span>
                        </div>
                    ))}
                </div>

                {/* Weekly Column */}
                <div className="task-section">
                    <h3>
                        Weekly
                        <span className="reset-info">Wed 00:00 UTC</span>
                    </h3>
                    {TASKS.weekly.map(task => (
                        <div 
                            key={task.id} 
                            className={`task-item ${completedTasks[task.id] ? 'completed' : ''}`}
                            onClick={() => toggleTask(task.id)}
                        >
                            <input 
                                type="checkbox" 
                                className="task-checkbox"
                                checked={!!completedTasks[task.id]}
                                readOnly
                            />
                            <span className="task-label">{task.label}</span>
                        </div>
                    ))}
                </div>

                {/* Monthly Column */}
                <div className="task-section">
                    <h3>
                        Monthly
                        <span className="reset-info">1st of Month</span>
                    </h3>
                    {TASKS.monthly.map(task => (
                        <div 
                            key={task.id} 
                            className={`task-item ${completedTasks[task.id] ? 'completed' : ''}`}
                            onClick={() => toggleTask(task.id)}
                        >
                            <input 
                                type="checkbox" 
                                className="task-checkbox"
                                checked={!!completedTasks[task.id]}
                                readOnly
                            />
                            <span className="task-label">{task.label}</span>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default TaskTracker;
