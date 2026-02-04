import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { parseHiscores } from '../utils/rs3';

const CharacterContext = createContext();

export const useCharacter = () => useContext(CharacterContext);

export const CharacterProvider = ({ children }) => {
    const [characters, setCharacters] = useState([]);
    const [selectedCharId, setSelectedCharId] = useState(null);
    const [characterData, setCharacterData] = useState([]); // Parsed skills
    const [loadingChars, setLoadingChars] = useState(true);
    const [loadingData, setLoadingData] = useState(false);

    // Derived state for the currently selected character object
    const selectedCharacter = characters.find(c => c.id === selectedCharId);

    // Initial Fetch
    useEffect(() => {
        fetchCharacters();
    }, []);

    // Fetch Hiscores when selected character changes
    useEffect(() => {
        if (selectedCharId) {
            const char = characters.find(c => c.id === selectedCharId);
            if (char) {
                fetchHiscores(char.name);
            }
        } else if (characters.length > 0) {
            // Auto select first if none selected
            setSelectedCharId(characters[0].id);
        }
    }, [selectedCharId, characters]);

    const fetchCharacters = async () => {
        try {
            setLoadingChars(true);
            const res = await axios.get('/api/characters');
            setCharacters(res.data);
            if (res.data.length > 0 && !selectedCharId) {
                setSelectedCharId(res.data[0].id);
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

    const value = {
        characters,
        selectedCharId,
        setSelectedCharId,
        selectedCharacter,
        characterData,
        loadingChars,
        loadingData,
        fetchCharacters,
        addCharacter,
        deleteCharacter,
        updateCharacterTasks
    };

    return (
        <CharacterContext.Provider value={value}>
            {children}
        </CharacterContext.Provider>
    );
};
