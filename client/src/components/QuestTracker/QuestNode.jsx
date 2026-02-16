// Recursive Quest Node
import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuestNode = ({ title, completedQuests, getQuestParents, getQuestTitle }) => {
    const navigate = useNavigate();
    // Quest logic
    const isCompleted = completedQuests.has(title);
    const parents = getQuestParents ? getQuestParents(title) : [];

    const handleNav = (e) => {
        if (!getQuestTitle) return; // if just a string non-link
        e.preventDefault();
        e.stopPropagation();
        navigate(`/quests/${encodeURIComponent(title.replace(/ /g, '_'))}`);
    };

    return (
        <li className="req-tree-li">
           <div className="req-item-content">
                <span 
                    className="quest-tree-link" 
                    onClick={handleNav}
                    style={{ color: isCompleted ? '#2ecc71' : '#e74c3c' }}
                >
                    {title}
                </span>
                <span className={`status-icon ${isCompleted ? 'status-met' : 'status-missing'}`}>
                    {isCompleted ? '✓' : '✗'}
                </span>
            </div>
            {parents.length > 0 && (
                <ul className="req-tree-ul">
                    {parents.map((pTitle, i) => (
                        <QuestNode 
                            key={i} 
                            title={pTitle} 
                            completedQuests={completedQuests} 
                            getQuestParents={getQuestParents}
                            getQuestTitle={getQuestTitle}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export default QuestNode;
