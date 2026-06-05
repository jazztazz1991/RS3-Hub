import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { parseHiscores } from '../utils/rs3';
import { useAuth } from './AuthContext';

const CharacterContext = createContext();

export const useCharacter = () => useContext(CharacterContext);

export const CharacterProvider = ({ children }) => {
    const { user } = useAuth();
    const [characters, setCharacters] = useState([]);
    const [selectedCharId, setSelectedCharId] = useState(null);
    const [primaryCharId, setPrimaryCharId] = useState(null);
    const [characterData, setCharacterData] = useState([]); // Parsed skills
    const [loadingChars, setLoadingChars] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [questSyncTime, setQuestSyncTime] = useState(0); // Timestamp of last quest sync

    // Derived state for the currently selected character object
    const selectedCharacter = characters.find(c => c.id === selectedCharId);

    // Initial Fetch — only when authenticated
    useEffect(() => {
        if (user) {
            fetchCharacters();
        } else {
            setCharacters([]);
            setSelectedCharId(null);
            setCharacterData([]);
            setLoadingChars(false);
        }
    }, [user]);

    // Fetch Hiscores when selected character changes
    useEffect(() => {
        if (selectedCharId) {
            const char = characters.find(c => c.id === selectedCharId);
            if (char) {
                fetchHiscores(char.name);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCharId]);

    const fetchCharacters = async () => {
        try {
            setLoadingChars(true);
            const res = await axios.get('/api/characters');
            setCharacters(res.data);
            if (res.data.length > 0) {
                // Read primary directly from localStorage here so both decisions happen
                // in one synchronous step — avoids the race between the localStorage
                // useEffect and the characters API response.
                const primaryId = (() => {
                    try { return JSON.parse(localStorage.getItem(`rs3hub_primary_char_${user?.id}`)); }
                    catch { return null; }
                })();
                const target = (primaryId && res.data.find(c => c.id === primaryId))
                    ? primaryId
                    : res.data[0].id;
                setPrimaryCharId(primaryId || null);
                setSelectedCharId(target);
            }
        } catch (err) {
            console.error('Failed to fetch characters', err);
        } finally {
            setLoadingChars(false);
        }
    };

    const fetchHiscores = async (rsn) => {
        try {
            setLoadingData(true);
            const res = await axios.get(`/api/hiscores/${rsn}`);
            const parsed = parseHiscores(res.data);
            setCharacterData(parsed);
        } catch (err) {
            console.error('Failed to fetch hiscores', err);
            setCharacterData([]);
        } finally {
            setLoadingData(false);
        }
    };

    const syncQuests = async (rsn) => {
        try {
            // This endpoint imports RuneMetrics quest data for the user
            // Since quests are currently tied to User (not Character), this syncs
            // the active character's quests to the user's profile.
            await axios.post('/api/quests/import', { username: rsn });
            console.log(`Synced quests for ${rsn}`);
            setQuestSyncTime(Date.now()); // Notify listeners
        } catch (err) {
            console.error('Failed to sync quests', err);
        }
    };



    const setPrimaryChar = useCallback((id) => {
        setPrimaryCharId(id);
        setSelectedCharId(id);
        if (user) {
            try { localStorage.setItem(`rs3hub_primary_char_${user.id}`, JSON.stringify(id)); }
            catch {}
        }
    }, [user]);

    const addCharacter = async (name) => {
        try {
            const res = await axios.post('/api/characters', { name });
            setCharacters([...characters, res.data]);
            setSelectedCharId(res.data.id); // Switch to new char
            return { success: true };
        } catch (err) {
            console.error('Failed to add character', err);
            return { 
                success: false, 
                error: err.response?.data?.error || 'Failed to add character' 
            };
        }
    };

    const deleteCharacter = async (id) => {
        try {
            await axios.delete(`/api/characters/${id}`);
            const newChars = characters.filter(c => c.id !== id);
            setCharacters(newChars);
            if (selectedCharId === id) {
                setSelectedCharId(newChars.length > 0 ? newChars[0].id : null);
                if (newChars.length === 0) setCharacterData([]);
            }
            if (primaryCharId === id) {
                setPrimaryCharId(null);
                if (user) {
                    try { localStorage.removeItem(`rs3hub_primary_char_${user.id}`); }
                    catch {}
                }
            }
            return true;
        } catch (err) {
            console.error('Failed to delete character', err);
            return false;
        }
    };

    const updateCharacterTasks = async (id, pinnedTasks, taskState) => {
        try {
            // Update local state immediately for UI responsiveness
            const updatedChars = characters.map(c => {
                if (c.id === id) {
                    return { 
                        ...c, 
                        pinned_tasks: pinnedTasks !== undefined ? JSON.stringify(pinnedTasks) : c.pinned_tasks,
                        task_state: taskState !== undefined ? JSON.stringify(taskState) : c.task_state 
                    };
                }
                return c;
            });
            setCharacters(updatedChars);

            // Send to DB
            await axios.put(`/api/characters/${id}`, {
                pinned_tasks: pinnedTasks !== undefined ? JSON.stringify(pinnedTasks) : undefined,
                task_state: taskState !== undefined ? JSON.stringify(taskState) : undefined
            });
            return true;
        } catch (err) {
            console.error('Failed to update character tasks', err);
            // Revert on failure? For now simpler to just log
            return false;
        }
    };

    const updateBlockList = async (id, blockList) => {
        try {
            const jsonString = JSON.stringify(blockList);

            // Optimistic update
            const updatedChars = characters.map(c => {
                if (c.id === id) {
                    return { ...c, block_list: jsonString };
                }
                return c;
            });
            setCharacters(updatedChars);

            // API Call
            await axios.put(`/api/characters/${id}`, {
                block_list: jsonString
            });
            return true;
        } catch (err) {
            console.error('Failed to update block list', err);
            return false;
        }
    };

    const updateArchMaterialBank = async (id, materialBank) => {
        try {
            const jsonString = JSON.stringify(materialBank);

            // Optimistic update
            setCharacters(prev => prev.map(c =>
                c.id === id ? { ...c, arch_material_bank: jsonString } : c
            ));

            await axios.put(`/api/characters/${id}`, { arch_material_bank: jsonString });
            return true;
        } catch (err) {
            console.error('Failed to update arch material bank', err);
            return false;
        }
    };

    const value = useMemo(() => ({
        characters,
        selectedCharId,
        setSelectedCharId,
        selectedCharacter,
        primaryCharId,
        setPrimaryChar,
        characterData,
        loadingChars,
        loadingData,
        fetchCharacters,
        addCharacter,
        deleteCharacter,
        updateCharacterTasks,
        updateBlockList,
        updateArchMaterialBank,
        questSyncTime
    }), [characters, selectedCharId, selectedCharacter, primaryCharId, setPrimaryChar, characterData, loadingChars, loadingData, questSyncTime]);

    return (
        <CharacterContext.Provider value={value}>
            {children}
        </CharacterContext.Provider>
    );
};
