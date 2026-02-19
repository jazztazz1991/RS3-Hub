import React from 'react';
import { Link } from 'react-router-dom';
import './Guides.css';

const Guides = () => {
    // Currently available guides
    const availableGuides = [
        { name: 'Fishing', path: '/guides/fishing',  icon: '🎣' },
        { name: 'Woodcutting', path: '/guides/woodcutting', icon: '🪓' },
        { name: 'Mining', path: '/guides/mining', icon: '⛏️' }
    ];

    return (
        <div className="guides-container">
            <h2>Training Guides</h2>
            <p>Select a skill to view optimal training methods for P2P and Ironman.</p>

            <div className="guides-grid">
                {availableGuides.map(guide => (
                    <Link to={guide.path} key={guide.name} className="guide-card">
                        <div className="guide-icon">
                            {guide.icon}
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
