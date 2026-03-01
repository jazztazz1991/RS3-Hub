import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { DAILY_TASKS, WEEKLY_TASKS, MONTHLY_TASKS } from '../../data/common/dailyTasksData';
import './TaskTracker.css';

const TaskTracker = () => {
    const { selectedCharacter, updateCharacterTasks } = useCharacter();

    // 1. Clock Timer for reset Checks
    const [currentTime, setCurrentTime] = useState(new Date());

    const [completedTasks, setCompletedTasks] = useState({});
    const [pinnedTasks, setPinnedTasks] = useState([]);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load Data from Character
    useEffect(() => {
        if (selectedCharacter) {
            try {
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
                console.error("Failed to parse character tasks in tracker", e);
            }
        } else {
             // Fallback or empty if no character selected
             setPinnedTasks([]);
             setCompletedTasks({});
        }
    }, [selectedCharacter]);

    // Save Logic Helper
    const saveToCharacter = (currentPinned, newCompleted) => {
        if (selectedCharacter) {
            updateCharacterTasks(selectedCharacter.id, currentPinned, newCompleted);
        }
    };

    // Toggle Logic
    const toggleTask = (taskId) => {
        const newTasks = { ...completedTasks };
        if (newTasks[taskId]) {
            delete newTasks[taskId]; // Uncheck
        } else {
            newTasks[taskId] = Date.now(); // Check
        }
        setCompletedTasks(newTasks);
        saveToCharacter(pinnedTasks, newTasks);
    };

    // --- RESET LOGIC ---
    useEffect(() => {
        const checkResets = () => {
            if (!completedTasks) return;
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
            const nowUTC = getUTC(now);
            const lastDailyReset = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 0, 0, 0)); 

            DAILY_TASKS.forEach(task => {
                const completedAt = newTasks[task.id];
                if (completedAt && completedAt < lastDailyReset.getTime()) {
                    delete newTasks[task.id];
                    hasChanges = true;
                }
            });

            // --- WEEKLY RESET CHECK --- (Wednesdays)
            let daysSinceWed = nowUTC.day - 3; 
            if (daysSinceWed < 0) daysSinceWed += 7; 
            const lastWeeklyReset = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date - daysSinceWed, 0, 0, 0));

            WEEKLY_TASKS.forEach(task => {
                const completedAt = newTasks[task.id];
                if (completedAt && completedAt < lastWeeklyReset.getTime()) {
                    delete newTasks[task.id];
                    hasChanges = true;
                }
            });

            // --- MONTHLY RESET CHECK --- (1st of Month)
            const lastMonthlyReset = new Date(Date.UTC(nowUTC.year, nowUTC.month, 1, 0, 0, 0));

            MONTHLY_TASKS.forEach(task => {
                const completedAt = newTasks[task.id];
                if (completedAt && completedAt < lastMonthlyReset.getTime()) {
                    delete newTasks[task.id];
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                setCompletedTasks(newTasks);
                saveToCharacter(pinnedTasks, newTasks);
            }
        };

        // Run check immediately and periodically
        checkResets();
    }, [currentTime]); // Check every second (could be optimized but fine for now)


    // Filter Display Tasks based on Pinned
    const dailyDisplayed = DAILY_TASKS.filter(t => pinnedTasks.includes(t.id));
    const weeklyDisplayed = WEEKLY_TASKS.filter(t => pinnedTasks.includes(t.id));
    const monthlyDisplayed = MONTHLY_TASKS.filter(t => pinnedTasks.includes(t.id));

    if (pinnedTasks.length === 0) {
        return (
            <div className="task-tracker-container empty">
                <h3>Daily Tasks</h3>
                <p>No tasks pinned. Go to the Daily Tasks page to add some!</p>
            </div>
        );
    }

    const renderTaskList = (title, tasks) => {
        if (tasks.length === 0) return null;
        return (
            <div className="task-group">
                <h4 className="task-group-title">{title} Tasks</h4>
                <div className="dashboard-task-list">
                    {tasks.map(task => (
                        <div 
                            key={task.id} 
                            className={`dashboard-task-item ${completedTasks[task.id] ? 'completed' : ''}`}
                            onClick={() => toggleTask(task.id)}
                        >
                            <input 
                                type="checkbox" 
                                checked={!!completedTasks[task.id]}
                                readOnly 
                            />
                            <span>{task.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="task-tracker-container">
            <h3>Pinned Tasks</h3>
            <div className="task-sections">
                {renderTaskList('Daily', dailyDisplayed)}
                {renderTaskList('Weekly', weeklyDisplayed)}
                {renderTaskList('Monthly', monthlyDisplayed)}
            </div>
        </div>
    );
};

export default TaskTracker;
