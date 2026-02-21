import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import p2pData from '../../data/guides/necromancy/necromancyP2P.json';
import ironmanData from '../../data/guides/necromancy/necromancyIronman.json';
import './Guides.css'; // Reusing global guide styles

const NecromancyGuide = () => {
    const [isIronman, setIsIronman] = useState(false);
    const navigate = useNavigate();

    const guideData = isIronman ? ironmanData : p2pData;

    return (
        <div className="guide-container">
            <header className="guide-header">
                <h2>Necromancy Training Guide</h2>
                
                <div className="toggle-container">
                    <span>Main</span>
                    <label className="switch">
                        <input 
                            type="checkbox" 
                            checked={isIronman}
                            onChange={() => setIsIronman(!isIronman)}
                        />
                        <span className="slider round"></span>
                    </label>
                    <span style={{color: isIronman ? '#e74c3c' : '#888'}}>Ironman</span>
                </div>
            </header>

            <div className="guide-intro">
                <p>
                    Necromancy is a combat skill that is trained through both <strong>Combat</strong> and <strong>Rituals</strong>.
                    Rituals located in the City of Um provide the fastest pure XP/HR, especially with disturbances, but Combat is essential for gear upgrades and unlocks.
                </p>
                
                <div className="method-card highlight-card">
                     <h3>Core Mechanic: Disturbances</h3>
                     <p>During rituals, interact with all disturbances (purple sparkles, wandering souls, defile, shambling horror) for massive XP bonuses (up to 300% more).</p>
                </div>
            </div>

            <div className="guide-content">
                {guideData && guideData.length > 0 ? (
                    guideData.map((item, index) => (
                        <div key={index} className="guide-card">
                            <div className="guide-card-header">
                                <h3 className="level-range">Level {item.levels}</h3>
                            </div>
                            <div className="guide-card-body">
                                <div className="method-details">
                                    <h4 className="method-title">{item.method.split(':')[0]}</h4>
                                    <p>{item.method.split(':')[1] || item.method}</p>
                                </div>
                                
                                {item.tips && (
                                    <div className="method-notes">
                                        <strong>Tip:</strong> {item.tips}
                                    </div>
                                )}
                                
                                {item.xp_rates && (
                                     <div className="xp-rates">
                                        <span className="label">Approx XP:</span> {item.xp_rates}
                                     </div>
                                )}
                            </div>
                            <div className="guide-actions">
                                <button 
                                    className="use-button"
                                    onClick={() => navigate('/calculators/necromancy')}
                                >
                                    Use in Calculator
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="error-message">No guide data available.</div>
                )}
            </div>
            
            <div className="guide-nav">
                <button onClick={() => navigate('/calculators/necromancy')} className="nav-btn">Go to Calculator</button>
                <button onClick={() => navigate('/guides')} className="nav-btn secondary">Back to Guides</button>
            </div>
        </div>
    );
};

export default NecromancyGuide;
