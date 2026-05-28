import { Link } from 'react-router-dom';
import { useFetch, API_BASE } from './WikiShared';
import './Wiki.css';

const SECTIONS = [
    { key: 'creatures',      label: 'Creatures',      path: 'creatures',      blurb: 'Monsters and beasts — combat level, slayer info, examine, drops (coming soon).' },
    { key: 'npcs',           label: 'NPCs',           path: 'npcs',           blurb: 'Non-combat characters — examine, location, role, related quests (coming soon).' },
    { key: 'achievements',   label: 'Achievements',   path: 'achievements',   blurb: 'In-game achievements grouped by category and difficulty. Per-character tracking coming soon.' },
    { key: 'locations',      label: 'Locations',      path: 'locations',      blurb: 'Cities, dungeons, regions — type, region, what’s there (coming soon).' },
    { key: 'resource_nodes', label: 'Resource Nodes', path: 'resource-nodes', blurb: 'Trees, rocks, fishing spots — skill, level, XP, yields.' },
];

export default function WikiIndex() {
    return (
        <div className="wiki-page">
            <div className="wiki-header">
                <div>
                    <h2>Wiki</h2>
                    <p className="wiki-sub">Browse RS3 wiki-sourced entity data: creatures, NPCs, achievements, locations, and resource nodes. Sample data ~20 per type for now — expand the seed via the sandbox.</p>
                </div>
                <Link to="/wiki-sandbox" className="wiki-back">Sandbox / sync →</Link>
            </div>

            <div className="wiki-hub">
                {SECTIONS.map(s => <HubCard key={s.key} section={s} />)}
            </div>
        </div>
    );
}

function HubCard({ section }) {
    const { data } = useFetch(`${API_BASE}/api/wiki-sandbox/${section.path}`);
    return (
        <Link to={`/wiki/${section.path}`} className="wiki-hub-card">
            <span className="wiki-hub-card-title">{section.label}</span>
            <span className="wiki-hub-card-blurb">{section.blurb}</span>
            <span className="wiki-hub-card-count">
                {data ? `${data.length} entries in catalogue` : 'Loading…'}
            </span>
        </Link>
    );
}
