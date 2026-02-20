import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import p2pData from '../../data/guides/archaeology/archaeologyP2P.json';
import ironmanData from '../../data/guides/archaeology/archaeologyIronman.json';
import './Guides.css';

const ArchaeologyGuide = () => {
    const [isIronman, setIsIronman] = useState(false);
    const navigate = useNavigate();

    // The data structure is a direct array of objects based on the scraper
    const guideData = isIronman ? ironmanData : p2pData;

    const handleUseMethod = (item) => {
        // Navigate to calculator with pre-filled state
        // For Archaeology, we might not have a complex calculator setup yet, 
        // but let's try to link it anyway.
        navigate('/calculators/archaeology', { 
            state: { 
                preSelectLevel: parseInt(item.levels.split('-')[0]), // Extract starting level
                preSelectMethod: item.method.substring(0, 50) + "..." // Pass a snippet
            } 
        });
    };

    return (
        <div className="guide-container">
            <header className="guide-header">
                <h2>Archaeology Training Guide</h2>
                
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
                                <p className="method-description">{item.method}</p>
                                {/* XP Rates are not explicitly scraped for Archaeology in this format yet */}
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
                    <div className="no-data">
                        <p>No guide data available for this mode.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArchaeologyGuide;
