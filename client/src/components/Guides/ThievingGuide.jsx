import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import p2pData from '../../data/guides/thieving/thievingP2P.json';
import ironmanData from '../../data/guides/thieving/thievingIronman.json';
import './Guides.css'; // Reusing global guide styles

const ThievingGuide = () => {
    const [isIronman, setIsIronman] = useState(false);
    const navigate = useNavigate();

    const guideData = isIronman ? ironmanData : p2pData;

    return (
        <div className="guide-container">
            <header className="guide-header">
                <h2>Thieving Training Guide</h2>
                
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
                    Thieving is a fast skill trained primarily by pickpocketing NPCs and cracking safes.
                    **Safecracking** (unlocked at level 62) is the fastest XP method in the game for mid-high levels.
                    At higher levels (90+), Crux Eqal Knights and Prifddinas Elves offer great rewards and AFK potential.
                </p>
                
                <div className="method-card highlight-card">
                     <h3>Must Unlock: Safecracking</h3>
                     <p>At Level 62, verify you have completed " Buyers and Cellars" to access the Thieves' Guild and unlock Safecracking. This boosts XP rates from ~60k to ~400k/hr immediately.</p>
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
                                        <span className="label">XP Rate:</span> {item.xp_rates}
                                     </div>
                                )}
                            </div>
                            <div className="guide-actions">
                                <button 
                                    className="use-button"
                                    onClick={() => navigate('/calculators/thieving')}
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
                <button onClick={() => navigate('/calculators/thieving')} className="nav-btn">Go to Calculator</button>
                <button onClick={() => navigate('/guides')} className="nav-btn secondary">Back to Guides</button>
            </div>
        </div>
    );
};

export default ThievingGuide;
