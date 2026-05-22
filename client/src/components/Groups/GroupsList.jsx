import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Groups.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const KIND_LABELS = {
    clan: 'Clan',
    friends: 'Friends',
    alts: 'My alts',
    comp: 'Competition',
};

export default function GroupsList() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function load() {
        setLoading(true);
        try {
            const r = await fetch(`${API_BASE}/api/groups`, { credentials: 'include' });
            if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || `Failed (${r.status})`);
            setGroups(await r.json());
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }
    useEffect(() => { load(); }, []);

    async function deleteGroup(id) {
        if (!confirm('Delete this group? Members and their snapshots stay (other groups may use them).')) return;
        await fetch(`${API_BASE}/api/groups/${id}`, { method: 'DELETE', credentials: 'include' });
        await load();
    }

    function copyShareLink(token) {
        const url = `${window.location.origin}/groups/share/${token}`;
        navigator.clipboard.writeText(url);
        alert('Share link copied!');
    }

    return (
        <div className="grp-page">
            <div className="grp-header">
                <h2>Groups</h2>
                <Link to="/groups/new" className="grp-new-btn">+ Create group</Link>
            </div>

            <p className="grp-hint">
                Track XP gains across any roster of RS3 players — your clan, your friends, or your own alt accounts.
                Each group gets a share link anyone can open without an account.
            </p>

            {error && <div className="grp-error">Error: {error}</div>}
            {loading && <p className="grp-empty">Loading…</p>}
            {!loading && groups.length === 0 && (
                <p className="grp-empty">You don't have any groups yet. Click "+ Create group" to start one.</p>
            )}

            <div className="grp-cards">
                {groups.map(g => (
                    <div className="grp-card" key={g.id}>
                        <div className="grp-card-head">
                            <Link to={`/groups/${g.id}`} className="grp-card-title">{g.name}</Link>
                            <span className="grp-kind">{KIND_LABELS[g.kind] || g.kind}</span>
                        </div>
                        {g.description && <div className="grp-card-desc">{g.description}</div>}
                        <div className="grp-card-meta">
                            <span>{g.member_count} member{g.member_count === 1 ? '' : 's'}</span>
                            <span>Created {new Date(g.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="grp-card-actions">
                            <button onClick={() => copyShareLink(g.share_token)}>Copy share link</button>
                            <button className="grp-danger" onClick={() => deleteGroup(g.id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
