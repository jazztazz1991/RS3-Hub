import { useEffect, useState } from 'react';

export const API_BASE = import.meta.env.VITE_API_URL || '';

// Generic fetcher hook — returns { data, loading, error }
export function useFetch(url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetch(url)
            .then(async r => {
                if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || `Failed (${r.status})`);
                return r.json();
            })
            .then(j => { if (!cancelled) setData(j); })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [url]);
    return { data, loading, error };
}

// JSON dump pane — shows EVERY field of the row (no stripping).
export function JsonPane({ data, label = 'Raw JSON' }) {
    return (
        <div className="wiki-pane">
            <h3 className="wiki-pane-head">{label}</h3>
            <pre className="wiki-json">{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}

export function Stat({ label, value }) {
    return (
        <div className="wiki-stat">
            <span className="wiki-stat-label">{label}</span>
            <span className="wiki-stat-value">{value ?? '—'}</span>
        </div>
    );
}

export function Row({ label, value }) {
    if (value == null || value === '') return null;
    return (
        <div className="wiki-row">
            <span className="wiki-row-label">{label}</span>
            <span className="wiki-row-value">{value}</span>
        </div>
    );
}

// Render the JSONB `data` blob as a small KV table — useful since infobox
// scraping picks up many more fields than our top-level columns capture.
export function ExtraFieldsTable({ data }) {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) return null;
    const entries = Object.entries(data).filter(([, v]) => v != null && v !== '');
    if (entries.length === 0) return null;
    return (
        <table className="wiki-data-table">
            <tbody>
                {entries.map(([k, v]) => (
                    <tr key={k}>
                        <th>{k}</th>
                        <td>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export function fmtMembers(b) {
    if (b == null) return null;
    return b ? 'P2P' : 'F2P';
}

// Shared detail-page atoms (used by every entity type's Detail component)
export function Card({ title, accent, children }) {
    return (
        <section className={`cr-card ${accent ? 'cr-card-' + accent : ''}`}>
            <h3 className="cr-card-title">{title}</h3>
            {children}
        </section>
    );
}

export function KV({ label, value, accent }) {
    if (value == null || value === '') return null;
    return (
        <div className={`cr-kv ${accent ? 'cr-kv-' + accent : ''}`}>
            <span className="cr-kv-label">{label}</span>
            <span className="cr-kv-value">{value}</span>
        </div>
    );
}

// Look up a value in the data blob across multiple possible key spellings.
export function field(obj, ...keys) {
    for (const k of keys) {
        const v = obj?.data?.[k];
        if (v != null && v !== '') return v;
    }
    return null;
}
// Render the lead paragraph + every named section we hydrated for the
// page. Pass `only` to limit to specific section names (e.g. for Creatures
// you might only want Location + Strategies, not the lore History).
export function Sections({ row, only = null }) {
    const lead = row?.data?._lead;
    const sections = row?.data?._sections || {};
    const keys = Object.keys(sections);
    const filtered = only
        ? keys.filter(k => only.some(o => k.toLowerCase().includes(o.toLowerCase())))
        : keys;
    if (!lead && filtered.length === 0) return null;
    return (
        <>
            {lead && (
                <section className="cr-card cr-card-about">
                    <h3 className="cr-card-title">About</h3>
                    <p className="cr-prose">{lead}</p>
                </section>
            )}
            {filtered.map(heading => (
                <section key={heading} className="cr-card">
                    <h3 className="cr-card-title">{heading}</h3>
                    <div className="cr-prose">
                        {sections[heading].split(/\n\n+/).map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>
                </section>
            ))}
        </>
    );
}

export function fieldNum(obj, ...keys) {
    const raw = field(obj, ...keys);
    if (raw == null) return null;
    const m = String(raw).match(/-?\d[\d,]*(\.\d+)?/);
    if (!m) return null;
    const n = parseFloat(m[0].replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
}
