import React from 'react';
import { Link } from 'react-router-dom';
import SkillIcon from '../Common/SkillIcon';
import './Guides.css';

const Guides = () => {
    // Currently available guides
    const availableGuides = [
        { name: 'Necromancy', path: '/guides/necromancy' },
        { name: 'Thieving', path: '/guides/thieving' },
        { name: 'Archaeology', path: '/guides/archaeology' },
        { name: 'Divination', path: '/guides/divination' },
        { name: 'Farming', path: '/guides/farming' },
        { name: 'Fishing', path: '/guides/fishing' },
        { name: 'Woodcutting', path: '/guides/woodcutting' },
        { name: 'Mining', path: '/guides/mining' },
        { name: 'Firemaking', path: '/guides/firemaking' },
        { name: 'Herblore', path: '/guides/herblore' },
        { name: 'Agility', path: '/guides/agility' },
        { name: 'Construction', path: '/guides/construction' },
        { name: 'Cooking', path: '/guides/cooking' },
        { name: 'Crafting', path: '/guides/crafting' },
        { name: 'Fletching', path: '/guides/fletching' },
        { name: 'Slayer', path: '/guides/slayer' }
    ];

    return (
        <div className="guides-container">
            <h2>Training Guides</h2>
            <p>Select a skill to view optimal training methods for P2P and Ironman.</p>

            <div className="guides-grid">
                {availableGuides.map(guide => (
                    <Link to={guide.path} key={guide.name} className="guide-card">
                        <div className="guide-icon">
                            <SkillIcon skillName={guide.name} className="guide-skill-img" />
                        </div>
                        <div className="guide-info">
                            <h3>{guide.name}</h3>
                        </div>
                    </Link>
                ))}
            </div>
             <div className="coming-soon">
                <p>More guides coming soon...</p>
            </div>
        </div>
    );
};

export default Guides;
