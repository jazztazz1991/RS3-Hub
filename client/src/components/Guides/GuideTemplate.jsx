import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SkillIcon from '../Common/SkillIcon';
import './Guides.css';

/**
 * Shared template for all skill training guides.
 * Accepts data in Schema B: [{title: string, content: string[]}]
 */
const GuideTemplate = ({ skillName, p2pData = [], ironmanData = [], calculatorSlug }) => {
    const [isIronman, setIsIronman] = useState(false);
    const navigate = useNavigate();

    const activeData = isIronman ? ironmanData : p2pData;
    const hasData = activeData && activeData.length > 0;

    return (
        <div className="guide-container">
            <header className="guide-header">
                <div className="guide-header-left">
                    <SkillIcon skillName={skillName} className="guide-skill-img" />
                    <h2>{skillName} Training Guide</h2>
                </div>
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
                    <span className={isIronman ? 'active ironman-label' : 'ironman-label'}>Ironman</span>
                </div>
            </header>

            <div className="guide-content">
                {!hasData ? (
                    <div className="guide-empty">
                        <p>No guide data available for {isIronman ? 'Ironman' : 'P2P'} yet.</p>
                        <p>Check the <a
                            href={`https://runescape.wiki/w/${skillName}_training`}
                            target="_blank"
                            rel="noreferrer"
                            className="wiki-link"
                        >RuneScape Wiki</a> for up-to-date training methods.</p>
                    </div>
                ) : (
                    activeData.map((section, index) => (
                        <div key={index} className="guide-section">
                            <h3>{section.title}</h3>
                            <div className="guide-text">
                                {(section.content || []).map((paragraph, pIndex) => (
                                    <ContentBlock key={pIndex} text={paragraph} />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="guide-nav">
                {calculatorSlug && (
                    <button
                        className="nav-btn"
                        onClick={() => navigate(`/calculators/${calculatorSlug}`)}
                    >
                        Go to Calculator
                    </button>
                )}
                <button
                    className="nav-btn secondary"
                    onClick={() => navigate('/guides')}
                >
                    Back to Guides
                </button>
            </div>
        </div>
    );
};

/**
 * Renders a single content block — either a bulleted list or a paragraph.
 */
const ContentBlock = ({ text }) => {
    if (!text) return null;

    const lines = text.split('\n');
    const isList = lines.some(l => l.trim().startsWith('- '));

    if (isList) {
        const items = lines
            .filter(l => l.trim().startsWith('- '))
            .map(l => l.replace(/^-\s*/, '').trim());
        return (
            <ul>
                {items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        );
    }

    return <p>{text}</p>;
};

export default GuideTemplate;
