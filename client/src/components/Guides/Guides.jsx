import React from 'react';
import { Link } from 'react-router-dom';
import SkillIcon from '../Common/SkillIcon';
import './Guides.css';

const GUIDES = [
    { name: 'Agility',       path: '/guides/agility' },
    { name: 'Archaeology',   path: '/guides/archaeology' },
    { name: 'Construction',  path: '/guides/construction' },
    { name: 'Cooking',       path: '/guides/cooking' },
    { name: 'Crafting',      path: '/guides/crafting' },
    { name: 'Divination',    path: '/guides/divination' },
    { name: 'Dungeoneering', path: '/guides/dungeoneering' },
    { name: 'Farming',       path: '/guides/farming' },
    { name: 'Firemaking',    path: '/guides/firemaking' },
    { name: 'Fishing',       path: '/guides/fishing' },
    { name: 'Fletching',     path: '/guides/fletching' },
    { name: 'Herblore',      path: '/guides/herblore' },
    { name: 'Hunter',        path: '/guides/hunter' },
    { name: 'Invention',     path: '/guides/invention' },
    { name: 'Magic',         path: '/guides/magic' },
    { name: 'Mining',        path: '/guides/mining' },
    { name: 'Necromancy',    path: '/guides/necromancy' },
    { name: 'Prayer',        path: '/guides/prayer' },
    { name: 'Runecrafting',  path: '/guides/runecrafting' },
    { name: 'Slayer',        path: '/guides/slayer' },
    { name: 'Smithing',      path: '/guides/smithing' },
    { name: 'Summoning',     path: '/guides/summoning' },
    { name: 'Thieving',      path: '/guides/thieving' },
    { name: 'Woodcutting',   path: '/guides/woodcutting' },
];

const Guides = () => (
    <div className="guides-hub">
        <div className="guides-hub-header">
            <h2>Training Guides</h2>
            <p>Step-by-step methods for P2P and Ironman. Select a skill to get started.</p>
            <span className="guides-count">{GUIDES.length} guides available</span>
        </div>

        <div className="guides-hub-grid">
            {GUIDES.map(guide => (
                <Link to={guide.path} key={guide.name} className="guides-hub-card">
                    <SkillIcon skillName={guide.name} className="hub-skill-icon" />
                    <div className="hub-card-body">
                        <span className="hub-card-name">{guide.name}</span>
                        <span className="hub-card-tags">P2P &amp; Ironman</span>
                    </div>
                </Link>
            ))}
        </div>
    </div>
);

export default Guides;
