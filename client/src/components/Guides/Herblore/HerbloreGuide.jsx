import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Guides.css';
import herbloreP2P from '../../../data/guides/herblore/herbloreP2P.json';
import ironmanHerbs from '../../../data/guides/herblore/ironmanHerbs.json';
import ironmanSecondaries from '../../../data/guides/herblore/ironmanSecondaries.json';

const HerbloreGuide = () => {
    const [isIronman, setIsIronman] = useState(false);
    const navigate = useNavigate();

    // Sort P2P methods by level
    const sortedP2PMethods = [...herbloreP2P].sort((a, b) => {
        const getLevel = (lvlStr) => {
            if (!lvlStr) return 0;
            const match = lvlStr.match(/(\d+)/);
            return match ? parseInt(match[0]) : 0;
        };
        const levelA = getLevel(a.level);
        const levelB = getLevel(b.level);
        return levelA - levelB;
    });

    return (
        <div className="guide-container">
            <header className="guide-header">
                <h2>Herblore Training Guide (1-120)</h2>
                
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
                     <h3>í·ª Herblore Overview</h3>
                     <p>
                        Herblore is a buyable skill for main accounts, but one of the most important skills for PvM due to Overloads.
                        <br/>
                        For Ironmen, it requires managing kingdom (Miscellania), farming runs, and boss drops.
                    </p>
                </div>
            </div>

            <div className="guide-content">
                {!isIronman ? (
                    // Mainscape View using Cards
                    sortedP2PMethods.map((method, index) => (
                        <div key={index} className="guide-card">
                            <div className="guide-card-header">
                                <h3 className="level-range">Level {method.level}</h3>
                            </div>
                            <div className="guide-card-body">
                                <div className="method-details">
                                    <h4 className="method-title">{method.method}</h4>
                                    <div className="xp-rates" style={{marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                        <div><span className="label">Category:</span> {method.category || 'General'}</div>
                                        <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                            <span><span className="label">XP:</span> {method.xp}</span>
                                            <span>
                                                <span className="label">Profit:</span> 
                                                <span style={{color: method.profit && method.profit.includes('-') ? '#e74c3c' : '#2ecc71', marginLeft: '0.5rem', fontWeight: 'bold'}}>
                                                    {method.profit || 'N/A'}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="guide-actions">
                                <button 
                                    className="use-button"
                                    onClick={() => navigate('/calculators/herblore')}
                                >
                                    Use in Calculator
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    // Ironman View using Tables inside styled containers
                    <>
                        <div className="guide-card">
                             <div className="guide-card-header">
                                <h3 className="level-range">Ironman: Herb Sources</h3>
                            </div>
                            <div className="guide-card-body">
                                <div className="table-responsive">
                                    <table className="guide-table">
                                        <thead>
                                            <tr>
                                                <th>Level</th>
                                                <th>Herb</th>
                                                <th>Source</th>
                                                <th>Usage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ironmanHerbs.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.level}</td>
                                                    <td style={{color: '#a5d6a7'}}>{item.herb}</td>
                                                    <td>{item.source}</td>
                                                    <td>{item.potion}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="guide-card" style={{marginTop: '2rem'}}>
                             <div className="guide-card-header">
                                <h3 className="level-range">Ironman: Secondary Ingredient Sources</h3>
                            </div>
                            <div className="guide-card-body">
                                <div className="table-responsive">
                                    <table className="guide-table">
                                        <thead>
                                            <tr>
                                                <th>Ingredient</th>
                                                <th>Primary Source</th>
                                                <th>Alt Source</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ironmanSecondaries.map((item, index) => (
                                                <tr key={index}>
                                                    <td style={{color: '#a5d6a7'}}>{item.ingredient}</td>
                                                    <td>{item.primary_source}</td>
                                                    <td>{item.alt_source}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="guide-nav">
                <button onClick={() => navigate('/calculators/herblore')} className="nav-btn">Go to Calculator</button>
                <button onClick={() => navigate('/guides')} className="nav-btn secondary">Back to Guides</button>
            </div>
        </div>
    );
};

export default HerbloreGuide;
