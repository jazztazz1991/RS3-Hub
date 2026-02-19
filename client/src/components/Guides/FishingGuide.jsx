import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import p2pData from '../../data/guides/fishing/fishingP2P.json';
import ironmanData from '../../data/guides/fishing/fishingIronman.json';
import './Guides.css';

const FishingGuide = () => {
    const [isIronman, setIsIronman] = useState(false);
    const navigate = useNavigate();

    // The scrape format is consistent, but check if we need to access .methods
    const guideData = isIronman ? ironmanData.methods : p2pData.methods;

    const handleUseMethod = (item) => {
        navigate('/calculators/fishing', { 
            state: { 
                preSelectMethod: item.method,
                preSelectLevel: item.min_level,
                preSelectTarget: item.max_level
            } 
        });
    };

    return (
        <div className="guide-container">
            <div className="guide-header">
                <h2>Fishing Training Guide</h2>
                <div className="toggle-container">
                    <span style={{color: !isIronman ? '#fff' : '#888'}}>P2P</span>
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
            </div>

            <div className="guide-content">
                {guideData && guideData.length > 0 ? (
                    guideData.map((item, index) => (
                        <div key={index} className="guide-card">
                            <div className="guide-card-header">
                                <h3>{item.levels}</h3>
                                <span className="method-badge">{item.method}</span>
                            </div>
                            <div className="guide-card-body">
                                <p className="xp-rate">XP Rates: {item.xp_rate_raw || "Varies"}</p>
                                <p>{item.notes}</p>
                                {item.category && <span className="method-badge" style={{backgroundColor: '#e67e22', color: 'white', fontSize: '0.8em'}}>{item.category}</span>}
                            </div>
                            <button 
                                className="use-button"
                                onClick={() => handleUseMethod(item)}
                            >
                                Use in Calculator
                            </button>
                        </div>
                    ))
                ) : (
                    <p>No guide methods found for this category yet.</p>
                )}
            </div>
        </div>
    );
};

export default FishingGuide;
