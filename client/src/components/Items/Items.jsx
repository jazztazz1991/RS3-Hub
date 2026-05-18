import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Items.css';

const API_BASE = import.meta.env.VITE_API_URL || '';
const PAGE_SIZE = 50;

// Categories we know are populated by the current seed. The set will grow
// as we ingest more of the wiki; for now we surface only what's useful.
const KNOWN_CATEGORIES = ['Potion', 'Herblore', 'Disassemblable'];

function useDebounced(value, delay = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}

function ItemCard({ item }) {
    return (
        <Link to={`/items/${item.slug}`} className="items-card">
            <div className="items-card-image">
                {item.image_url
                    ? <img src={item.image_url} alt={item.name} loading="lazy" />
                    : <span className="items-card-image-placeholder">?</span>}
            </div>
            <div className="items-card-body">
                <div className="items-card-name">{item.name}</div>
                <div className="items-card-meta">
                    {item.members && <span className="items-badge items-badge-members">Members</span>}
                    {item.ge_price_current != null && (
                        <span className="items-card-price">{item.ge_price_current.toLocaleString()} gp</span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function Items() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(0);
    const [data, setData] = useState({ count: 0, results: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const debouncedSearch = useDebounced(search, 250);

    // Reset page to 0 when filters change
    useEffect(() => { setPage(0); }, [debouncedSearch, category]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (category) params.set('category', category);
        params.set('limit', String(PAGE_SIZE));
        params.set('offset', String(page * PAGE_SIZE));

        fetch(`${API_BASE}/api/items?${params.toString()}`, { credentials: 'include' })
            .then(async (res) => {
                if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    throw new Error(d.message || `Request failed (${res.status})`);
                }
                return res.json();
            })
            .then((d) => { if (!cancelled) setData(d); })
            .catch((err) => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [debouncedSearch, category, page]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(data.count / PAGE_SIZE)), [data.count]);
    const start = data.results.length === 0 ? 0 : page * PAGE_SIZE + 1;
    const end = page * PAGE_SIZE + data.results.length;

    return (
        <div className="items-page">
            <div className="items-page-header">
                <h1>Items</h1>
                <p className="items-page-sub">
                    Browse the catalog. Click any item for full infobox + creation + drops + shop info.
                </p>
            </div>

            <div className="items-controls">
                <input
                    className="items-search"
                    type="search"
                    placeholder="Search by name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select
                    className="items-filter"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                >
                    <option value="">All categories</option>
                    {KNOWN_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <div className="items-status">
                {loading ? 'Loading...' :
                    error ? <span className="items-error">Error: {error}</span> :
                        data.count === 0 ? 'No items match your filters.' :
                            `Showing ${start}-${end} of ${data.count.toLocaleString()}`}
            </div>

            <div className="items-grid">
                {data.results.map(item => <ItemCard key={item.id} item={item} />)}
            </div>

            {totalPages > 1 && (
                <div className="items-pagination">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                        ← Prev
                    </button>
                    <span>Page {page + 1} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
