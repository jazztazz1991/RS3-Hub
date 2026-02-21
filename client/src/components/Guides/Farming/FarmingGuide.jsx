import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Guides.css';
import farmingP2P from '../../../data/guides/farming/farmingP2P.json';
import farmingIronman from '../../../data/guides/farming/farmingIronman.json';
import ironmanFoodData from '../../../data/guides/farming/ironmanFood.json';

const FarmingGuide = () => {
    const [isIronman, setIsIronman] = useState(false);
    const navigate = useNavigate();
    
    // Select data based on mode
    const guideData = isIronman ? farmingIronman : farmingP2P;

    return (
        <div className="guide-container">
            <header className="guide-header">
                <h2>Farming Training Guide</h2>
                
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
                <div className="method-card highlight-card">
                     <h3>í²¡ Player Owned Farms (POF) is Meta</h3>
                     <p>
                        Since its release, Player Owned Farms (Ardougne) and Ranch Out of Time (Anachronia) 
                        have become the primary way to train Farming. It is passive, extremely high XP, and low effort.
                        <br/>
                        <strong>Tree runs</strong> are still good for supplementing XP but are no longer strictly "efficient" 
                        if you are consistent with POF.
                    </p>
                </div>
            </div>

            <div className="guide-content">
                {guideData.map((method, index) => (
                    <div key={index} className="guide-card">
                        <div className="guide-card-header">
                            <h3 className="level-range">Level {method.levels}</h3>
                        </div>
                        <div className="guide-card-body">
                            <div className="method-details">
                                <h4 className="method-title">{method.method.split(':')[0]}</h4>
                                <p dangerouslySetInnerHTML={{ __html: method.method.substring(method.method.indexOf(':') + 1) }}></p>
                            </div>
                            
                            <div className="xp-rates" style={{marginTop: '10px'}}>
                                <span className="label">XP Rate:</span> {method.xp_rates}
                            </div>
                            
                            {method.tips && (
                                <div className="method-notes">
                                    <strong>Tip:</strong> {method.tips}
                                </div>
                            )}
                        </div>
                         <div className="guide-actions">
                            <button 
                                className="use-button"
                                onClick={() => navigate('/calculators/farming')}
                            >
                                Use in Calculator
                            </button>
                        </div>
                    </div>
                ))}

                {isIronman && (
                    <div className="guide-card">
                         <div className="guide-card-header">
                            <h3 className="level-range">Ironman: Animal Food Sources</h3>
                        </div>
                        <div className="guide-card-body">
                            <div className="table-responsive">
                                <table className="guide-table">
                                    <thead>
                                        <tr>
                                            <th>Animals</th>
                                            <th>Optimal Food</th>
                                            <th>Sources</th>
                                            <th>Ease</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ironmanFoodData.map((row, index) => (
                                            <tr key={index}>
                                                <td>{row.animals}</td>
                                                <td>{row.food_type}</td>
                                                <td>{row.sources}</td>
                                                <td>{row.ease}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="guide-nav">
                <button onClick={() => navigate('/calculators/farming')} className="nav-btn">Go to Calculator</button>
                <button onClick={() => navigate('/guides')} className="nav-btn secondary">Back to Guides</button>
            </div>
        </div>
    );
};

export default FarmingGuide;
