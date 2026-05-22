import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Groups.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function GroupForm() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [kind, setKind] = useState('friends');
    const [membersText, setMembersText] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const [invalidNames, setInvalidNames] = useState([]);

    async function submit(e) {
        e.preventDefault();
        setError(null);
        setInvalidNames([]);
        const members = membersText
            .split(/[\n,]+/)
            .map(s => s.trim())
            .filter(Boolean);
        if (!name.trim()) { setError('Name is required.'); return; }
        if (members.length === 0) { setError('Add at least one member name.'); return; }

        setCreating(true);
        try {
            const r = await fetch(`${API_BASE}/api/groups`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description: description.trim() || null, kind, members }),
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) {
                if (Array.isArray(j.invalid_names) && j.invalid_names.length > 0) setInvalidNames(j.invalid_names);
                throw new Error(j.message || `Failed (${r.status})`);
            }
            // Group was created — but some names may have been rejected. Take
            // the user to the group so they can see who got in, and surface
            // invalids via the URL state if any.
            if (Array.isArray(j.invalid_names) && j.invalid_names.length > 0) {
                alert(
                    `Group created with ${j.added} member${j.added === 1 ? '' : 's'}.\n\n`
                    + `These names weren't found on hiscores and were skipped:\n${j.invalid_names.join(', ')}`
                );
            }
            navigate(`/groups/${j.id}`);
        } catch (err) { setError(err.message); }
        finally { setCreating(false); }
    }

    return (
        <div className="grp-page">
            <div className="grp-header">
                <h2>New group</h2>
                <Link to="/groups" className="grp-link">← Back</Link>
            </div>

            <form className="grp-form" onSubmit={submit}>
                <label>
                    Name
                    <input
                        type="text"
                        placeholder="Saturday bingo, My alts, Clan core, …"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        maxLength={80}
                        required
                    />
                </label>

                <label>
                    Kind
                    <select value={kind} onChange={e => setKind(e.target.value)}>
                        <option value="friends">Friends</option>
                        <option value="clan">Clan</option>
                        <option value="alts">My alts (multiple accounts)</option>
                        <option value="comp">Competition</option>
                    </select>
                </label>

                <label>
                    Description (optional)
                    <textarea
                        placeholder="What's this group for?"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        maxLength={1000}
                        rows={2}
                    />
                </label>

                <label>
                    Members
                    <textarea
                        placeholder={'One RS3 name per line, or comma-separated.\nExample:\nZezima\nLynx Titan\nWoox'}
                        value={membersText}
                        onChange={e => setMembersText(e.target.value)}
                        rows={8}
                        required
                    />
                    <span className="grp-hint-small">
                        Up to 200 names. Names must match how they appear on the RS3 hiscores (case- and space-sensitive).
                    </span>
                </label>

                {error && <div className="grp-error">{error}</div>}
                {invalidNames.length > 0 && (
                    <div className="grp-error">
                        <strong>Names not found on hiscores:</strong> {invalidNames.join(', ')}
                    </div>
                )}

                <div className="grp-form-actions">
                    <Link to="/groups" className="grp-cancel">Cancel</Link>
                    <button type="submit" disabled={creating} className="grp-submit">
                        {creating ? 'Creating…' : 'Create group'}
                    </button>
                </div>
            </form>
        </div>
    );
}
