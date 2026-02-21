import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import p2pData from '../../data/guides/divination/divinationP2P.json';
import ironmanData from '../../data/guides/divination/divinationIronman.json';
import './Guides.css';

const DivinationGuide = () => {
    const [isIronman, setIsIronman] = useState(false);
    const navigate = useNavigate();

    const guideData = isIronman ? ironmanData : p2pData;

    return (
        <div className="guide-container">
            <header className="guide-header">
                <h2>Divination Training Guide</h2>
                
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
                    Divination is a gathering skill that involves harvesting energy from wisps. 
                    It is a slow skill if trained traditionally, but daily <strong>Guthixian Caches</strong> offer massive XP rates.
                    This guide focuses on the most efficient methods to reach 99 and beyond.
                </p>
                
                <div className="method-card highlight-card">
                     <h3>Top Tip: Guthixian Cache</h3>
                     <p>Do this D&D every day! It yields huge XP drops for 10-20 mins work. Resets daily.</p>
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
                                    onClick={() => navigate('/calculators/divination')}
                                >
                                    Use in Calculator
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="error-message">No guide data available. Please run the scraper.</div>
                )}
            </div>
            
            <div className="guide-nav">
                <button onClick={() => navigate('/calculators/divination')} className="nav-btn">Go to Calculator</button>
                <button onClick={() => navigate('/guides')} className="nav-btn secondary">Back to Guides</button>
            </div>
        </div>
    );
};

export default DivinationGuide;
