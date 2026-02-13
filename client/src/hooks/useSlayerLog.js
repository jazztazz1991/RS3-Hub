import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ACTIVE_TASK_KEY = 'rs3-hub-slayer-active';

export const useSlayerLog = () => {
    const [history, setHistory] = useState([]);
    const [activeTask, setActiveTask] = useState(null);
    const { user } = useAuth();

    // Load active task on mount (Keep local storage for resilience)
    useEffect(() => {
        const savedActive = localStorage.getItem(ACTIVE_TASK_KEY);
        if (savedActive) {
            try {
                const parsed = JSON.parse(savedActive);
                setActiveTask(parsed);
            } catch (e) {
                console.error("Failed to parse active task", e);
            }
        }
    }, []);

    // Load History from backend
    useEffect(() => {
        if (user) {
            axios.get('/api/slayer/history')
                .then(res => {
                    setHistory(res.data);
                })
                .catch(err => {
                    console.error("Failed to fetch slayer history", err);
                });
        } else {
            setHistory([]);
        }
    }, [user]);

    // Save active task when changed
    useEffect(() => {
        if (activeTask) {
            localStorage.setItem(ACTIVE_TASK_KEY, JSON.stringify(activeTask));
        } else {
            localStorage.removeItem(ACTIVE_TASK_KEY);
        }
    }, [activeTask]);

    const startTask = (monster, count, master) => {
        const task = {
            id: crypto.randomUUID(),
            monster, // full object { id, name, xp }
            master, // full object or string
            assignedCount: parseInt(count),
            startTime: Date.now(),
            accumulatedTime: 0, // ms
            isRunning: true,
            lastTick: Date.now(),
            logs: [] // for notes or drops
        };
        setActiveTask(task);
    };

    const stopTask = () => {
        if (activeTask) {
            const now = Date.now();
            setActiveTask(prev => ({
                ...prev,
                isRunning: false,
                accumulatedTime: prev.accumulatedTime + (prev.isRunning ? (now - prev.lastTick) : 0),
                lastTick: now
            }));
        }
    };

    const resumeTask = () => {
        if (activeTask) {
            setActiveTask(prev => ({
                ...prev,
                isRunning: true,
                lastTick: Date.now()
            }));
        }
    };

    const completeTask = async (actualCount, notes = "") => {
        if (!activeTask) return;
        
        // Finalize time
        const now = Date.now();
        const totalTime = activeTask.accumulatedTime + (activeTask.isRunning ? (now - activeTask.lastTick) : 0);
        
        const completedEntry = {
            monsterId: activeTask.monster.id,
            monsterName: activeTask.monster.name,
            masterName: activeTask.master?.name || "Unknown",
            count: parseInt(actualCount),
            duration: totalTime, // ms
            timestamp: now,
            notes,
            xpPerKill: activeTask.monster.xp, // Snapshot in case wiki changes
            totalXp: parseInt(actualCount) * activeTask.monster.xp
        };

        if (user) {
            try {
                const res = await axios.post('/api/slayer/log', completedEntry);
                setHistory(prev => [res.data, ...prev]);
                setActiveTask(null);
            } catch (err) {
                console.error("Failed to save slayer log", err);
                alert("Error saving log to database. Check console for details.");
            }
        } else {
            console.warn("User not logged in, cannot save to DB");
            setActiveTask(null);
        }
    };

    const cancelTask = () => {
        setActiveTask(null);
    };

    const deleteTask = async (taskId) => {
        if (!user) return;
        
        try {
            await axios.delete(`/api/slayer/log/${taskId}`);
            setHistory(prev => prev.filter(task => task.id !== taskId));
        } catch (err) {
            console.error("Failed to delete task", err);
            alert("Failed to delete task.");
        }
    };

    const getStatsForMonster = (monsterId) => {
        const monsterTasks = history.filter(h => h.monsterId === monsterId && h.duration > 0 && h.count > 0);
        if (monsterTasks.length === 0) return null;

        const totalKills = monsterTasks.reduce((sum, t) => sum + t.count, 0);
        const totalTimeMs = monsterTasks.reduce((sum, t) => sum + t.duration, 0);
        
        // Avoid div by zero
        if (totalTimeMs === 0) return null;

        const msPerKill = totalTimeMs / totalKills;
        const killsPerHour = (3600000 / msPerKill);
        const avgXpPerHour = killsPerHour * (monsterTasks[0].xpPerKill || 0); // Use most recent XP val?

        return {
            kills: totalKills,
            tasks: monsterTasks.length,
            killsPerHour,
            avgXpPerHour
        };
    };

    return {
        activeTask,
        history,
        startTask,
        stopTask,
        resumeTask,
        completeTask,
        cancelTask,
        deleteTask,
        getStatsForMonster,
        setActiveTask // Exposed for timer updates if needed, though mostly internal
    };
};
