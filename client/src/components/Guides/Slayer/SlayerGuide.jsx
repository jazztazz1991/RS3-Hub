import React, { useState } from 'react';
import p2pData from '../../../data/guides/slayer/slayerP2P.json';
import ironmanData from '../../../data/guides/slayer/slayerIronman.json';
import '../Guides.css';

const SlayerGuide = () => {
    const [isIronman, setIsIronman] = useState(false);
    
    // Safety check
    const p2p = p2pData || [];
    const iron = ironmanData || [];
    const activeData = isIronman ? iron : p2p;

    return (
        <div className="guide-container">
            <header className="guide-header">
                <h2>Slayer Training Guide</h2>
                <div className="toggle-container">
                    <span className={!isIronman ? 'active' : ''}>Main</span>
                    <label className="switch">
                        <input 
                            type="checkbox" 
                            checked={isIronman}
                            onChange={() => setIsIronman(!isIronman)}
                        />
                        <span className="slider round"></span>
                    </label>
                    <span className={isIronman ? 'active' : ''}>Ironman</span>
                </div>
            </header>

            <div className="guide-content">
                {activeData.length === 0 && (
                     <div className="info-banner" style={{marginBottom: '20px', padding: '10px', backgroundColor: '#e74c3c33', borderLeft: '4px solid #e74c3c', color: '#ecf0f1'}}>
                        <p>No guide data available for this mode yet.</p>
                    </div>
                )}

                {activeData.map((method, index) => (
                    <div key={index} className="guide-section">
                        <h3>{method.title}</h3>
                        <div className="guide-text">
                            {method.content.map((paragraph, pIndex) => (
                                <div key={pIndex}>
                                    {paragraph.trim().startsWith('-') ? (
                                        <ul>
                                            {paragraph.split('\n').filter(l => l.trim().startsWith('-')).map((item, i) => (
                                                <li key={i}>{item.replace(/^-\s*/, '')}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>{paragraph}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SlayerGuide;
