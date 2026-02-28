import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CHANGELOG } from '../../data/common/changelog';
import './Changelog.css';

const CATEGORY_COLORS = {
    Feature: '#b5a642',
    Guides: '#5b9bd5',
    Calculators: '#6bbf6b',
    Quests: '#c07c3e',
    'Daily Tasks': '#9b6bc7',
    UI: '#5bbfbf',
    'Bug Fix': '#c05b5b',
    Content: '#8a8a8a',
};

function formatDate(iso) {
    const [year, month, day] = iso.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// Group entries by date
function groupByDate(entries) {
    const groups = {};
    for (const entry of entries) {
        if (!groups[entry.date]) groups[entry.date] = [];
        groups[entry.date].push(entry);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

const Changelog = () => {
    const { user } = useAuth();
    const grouped = groupByDate(CHANGELOG);

    return (
        <div className="changelog-page">
            <div className="changelog-header">
                <Link to={user ? '/dashboard' : '/'} className="changelog-back">← Back</Link>
                <h1>Site Changelog</h1>
                <p className="changelog-subtitle">A record of all updates, fixes, and new content added to RuneHub.</p>
            </div>

            <div className="changelog-body">
                {grouped.map(([date, entries]) => (
                    <div key={date} className="changelog-group">
                        <h2 className="changelog-date">{formatDate(date)}</h2>
                        <ul className="changelog-entries">
                            {entries.map((entry, i) => (
                                <li key={i} className="changelog-entry">
                                    <span
                                        className="changelog-category"
                                        style={{ '--cat-color': CATEGORY_COLORS[entry.category] || '#888' }}
                                    >
                                        {entry.category}
                                    </span>
                                    <span className="changelog-description">{entry.description}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Changelog;
