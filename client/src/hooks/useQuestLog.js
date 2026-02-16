import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCharacter } from '../context/CharacterContext';

export const useQuestLog = () => {
    const { user } = useAuth();
    const { questSyncTime } = useCharacter(); // Re-fetch on sync completion
    const [completedQuests, setCompletedQuests] = useState(new Set());

    const [loading, setLoading] = useState(false);

    const fetchQuests = useCallback(async () => {
        if (!user) {
            setCompletedQuests(new Set());
            return;
        }

        try {
            setLoading(true);
            const res = await axios.get('/api/quests');
            // Store as set of titles for O(1) lookups
            const titles = new Set(res.data.map(q => q.questTitle));
            setCompletedQuests(titles);
        } catch (err) {
            console.error("Failed to fetch quests", err);
        } finally {
            setLoading(false);
        }
    }, [user, questSyncTime]); // Re-fetch when user or sync time changes

    useEffect(() => {
        fetchQuests();
    }, [fetchQuests]);



    const toggleQuest = async (title, status) => {
        if (!user) return; // Optimistic UI needs revert logic if failure, but keep simple for now
        
        // Optimistic update
        setCompletedQuests(prev => {
            const next = new Set(prev);
            if (status) next.add(title);
            else next.delete(title);
            return next;
        });

        try {
            await axios.post('/api/quests/toggle', { title, completed: status });
        } catch (err) {
            console.error("Failed to toggle quest", err);
            // Revert on failure
            fetchQuests();
        }
    };

    const importQuests = async (username) => {
        if (!user) return;
        try {
            setLoading(true);
            const res = await axios.post('/api/quests/import', { username });
            await fetchQuests(); // Refresh
            return res.data;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        completedQuests, // Set<string>
        toggleQuest,
        importQuests,
        loading
    };
};
