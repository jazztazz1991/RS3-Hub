import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import p2pData from '../../data/guides/firemaking/firemakingP2P.json';
import ironmanData from '../../data/guides/firemaking/firemakingIronman.json';
import './Guides.css';

const FiremakingGuide = () => {
    const [isIronman, setIsIronman] = useState(false);
    const navigate = useNavigate();

    const guideData = isIronman ? (ironmanData.methods || []) : (p2pData.methods || []);

    const handleUseMethod = (method) => {
        // Navigate to calculator with pre-filled state
        navigate('/calculators/firemaking', { 
            state: { 
                preSelectMethod: method.method,
                preSelectTarget: method.max_level
            } 
        });
    };

    return (
        <div className="guide-container">
            <header className="guide-header">
                <h2>Firemaking Training Guide</h2>
                
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

            <div className="guide-content">
                {guideData && guideData.length > 0 ? (
                    guideData.map((item, index) => (
                        <div key={index} className="guide-card">
                            <div className="guide-card-header">
                                <h3 className="level-range">Level {item.levels}</h3>
                            </div>
                            <div className="guide-card-body">
                                <div className="method-details">
                                    <h4 className="method-title">{item.method}</h4>
                                    <p>{item.notes}</p>
                                </div>
                                <div className="xp-rates" style={{marginTop: '10px'}}>
                                    <span className="label">XP Rate:</span> {item.xp_rate_raw || "Varies"}
                                </div>
                                {item.category && !['Main', 'General', 'Methods'].includes(item.category) && (
                                    <span className="method-badge" style={{backgroundColor: '#e67e22', color: 'white', fontSize: '0.8em', marginTop: '10px', display: 'inline-block'}}>
                                        {item.category}
                                    </span>
                                )}
                            </div>
                            <div className="guide-actions">
                                <button 
                                    className="use-button"
                                    onClick={() => handleUseMethod(item)}
                                >
                                    Use in Calculator
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No guide data available.</p>
                )}
            </div>
        </div>
    );
};

export default FiremakingGuide;
