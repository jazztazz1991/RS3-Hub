import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    
    // Admin Check
    if (!user || user.isAdmin === false) {
        return <div className="admin-loading">Access Denied. Admins only.</div>;
    }

    const [activeTab, setActiveTab] = useState('reports');
    
    // Reports State
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [expandedRows, setExpandedRows] = useState({});

    // Suggestions State
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [suggestionFilter, setSuggestionFilter] = useState('all');
    const [expandedSuggestions, setExpandedSuggestions] = useState({});

    // Users State
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    
    const [error, setError] = useState(null);

    // Use environment variable for API URL
    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:5000');

    useEffect(() => {
        if (activeTab === 'reports') fetchReports();
        if (activeTab === 'suggestions') fetchSuggestions();
        if (activeTab === 'users') fetchUsers();
    }, [activeTab]);

    // --- Reports Logic ---
    const fetchReports = async () => {
        try {
            setLoadingReports(true);
            const res = await axios.get(`${API_URL}/api/reports?timestamp=${Date.now()}`);
            setReports(res.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to load reports.');
        } finally {
            setLoadingReports(false);
        }
    };

    const updateReportStatus = async (id, newStatus) => {
        try {
            await axios.patch(`${API_URL}/api/reports/${id}/status`, { status: newStatus });
            setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredReports = reports.filter(r => 
        filterStatus === 'all' ? true : r.status === filterStatus
    );

    const reportStats = {
        open: reports.filter(r => r.status === 'open').length,
        investigating: reports.filter(r => r.status === 'investigating').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        total: reports.length
    };

    // --- Users Logic ---
    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const res = await axios.get(`${API_URL}/api/users?timestamp=${Date.now()}`);
            setUsers(res.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users.');
        } finally {
            setLoadingUsers(false);
        }
    };

    // --- Suggestions Logic ---
    const fetchSuggestions = async () => {
        try {
            setLoadingSuggestions(true);
            const res = await axios.get(`${API_URL}/api/suggestions?timestamp=${Date.now()}`);
            setSuggestions(res.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
            setError('Failed to load suggestions.');
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const updateSuggestionStatus = async (id, newStatus) => {
        try {
            await axios.patch(`${API_URL}/api/suggestions/${id}/status`, { status: newStatus });
            setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const toggleSuggestionRow = (id) => {
        setExpandedSuggestions(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredSuggestions = suggestions.filter(s => 
        suggestionFilter === 'all' ? true : s.status === suggestionFilter
    );

    const suggestionStats = {
        open: suggestions.filter(s => s.status === 'open').length,
        investigating: suggestions.filter(s => s.status === 'investigating').length,
        implemented: suggestions.filter(s => s.status === 'implemented').length,
        rejected: suggestions.filter(s => s.status === 'rejected').length,
        total: suggestions.length
    };

    const toggleUserStatus = async (id, currentStatus) => {
        try {
            if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
            
            const newStatus = !currentStatus;
            await axios.patch(`${API_URL}/api/users/${id}/status`, { isActive: newStatus });
            setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: newStatus } : u));
        } catch (err) {
            console.error('Error toggling user status:', err);
            alert('Failed to update user status');
        }
    };

    return (
        <div className="admin-dashboard-container">
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <div className="admin-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        Bug Reports
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('suggestions')}
                    >
                        Suggestions
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        User Management
                    </button>
                </div>
                <button onClick={() => {
                    if (activeTab === 'reports') fetchReports();
                    else if (activeTab === 'suggestions') fetchSuggestions();
                    else fetchUsers();
                }} className="refresh-btn">Refresh</button>
            </header>

            {error && <div className="error-banner">{error}</div>}

            {activeTab === 'reports' && (
                <>
                    <div className="admin-stats">
                        <span className="stat-badge open">Open: {reportStats.open}</span>
                        <span className="stat-badge investigating">Investigating: {reportStats.investigating}</span>
                        <span className="stat-badge resolved">Resolved: {reportStats.resolved}</span>
                        <span className="stat-badge total">Total: {reportStats.total}</span>
                    </div>

                    <div className="admin-controls">
                        <label>Filter Status: </label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">All</option>
                            <option value="open">Open</option>
                            <option value="investigating">Investigating</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    {loadingReports ? <div className="admin-loading">Loading Reports...</div> : (
                        <div className="reports-table-container">
                            <table className="reports-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map(report => (
                                        <React.Fragment key={report.id}>
                                            <tr className={`report-row ${report.status} ${expandedRows[report.id] ? 'expanded' : ''}`} onClick={() => toggleRow(report.id)}>
                                                <td>{new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString()}</td>
                                                <td><span className={`type-badge ${report.type}`}>{report.type}</span></td>
                                                <td className="desc-cell">{report.description.substring(0, 100)}{report.description.length > 100 && '...'}</td>
                                                <td>
                                                    <select 
                                                        value={report.status} 
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => updateReportStatus(report.id, e.target.value)}
                                                        className={`status-select ${report.status}`}
                                                    >
                                                        <option value="open">Open</option>
                                                        <option value="investigating">Investigating</option>
                                                        <option value="resolved">Resolved</option>
                                                        <option value="closed">Closed</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button className="expand-btn">{expandedRows[report.id] ? 'Hide' : 'View'}</button>
                                                </td>
                                            </tr>
                                            {expandedRows[report.id] && (
                                                <tr className="detail-row">
                                                    <td colSpan="5">
                                                        <div className="report-details">
                                                            <div className="detail-section">
                                                                <h4>Full Description</h4>
                                                                <p>{report.description}</p>
                                                            </div>
                                                            <div className="detail-grid">
                                                                <div className="detail-item">
                                                                    <strong>Path:</strong> {report.path || report.contextData?.path || '/'}
                                                                </div>
                                                                <div className="detail-item">
                                                                    <strong>Browser:</strong> {report.browser || report.contextData?.browser || 'Unknown'}
                                                                </div>
                                                                <div className="detail-item">
                                                                    <strong>User ID:</strong> {report.userId || 'Anonymous'}
                                                                </div>
                                                            </div>
                                                            {report.contextData && (
                                                                <div className="detail-section">
                                                                    <h4>Context Data</h4>
                                                                    <pre className="json-view">
                                                                        {JSON.stringify(report.contextData, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {filteredReports.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="no-data">No reports found matching criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'suggestions' && (
                <>
                    <div className="admin-stats">
                        <span className="stat-badge open">Open: {suggestionStats.open}</span>
                        <span className="stat-badge investigating">Investigating: {suggestionStats.investigating}</span>
                        <span className="stat-badge resolved">Implemented: {suggestionStats.implemented}</span>
                        <span className="stat-badge closed">Rejected: {suggestionStats.rejected}</span>
                    </div>

                    <div className="admin-controls">
                        <label>Filter Status: </label>
                        <select value={suggestionFilter} onChange={(e) => setSuggestionFilter(e.target.value)}>
                            <option value="all">All</option>
                            <option value="open">Open</option>
                            <option value="investigating">Investigating</option>
                            <option value="implemented">Implemented</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {loadingSuggestions ? <div className="admin-loading">Loading Suggestions...</div> : (
                        <div className="reports-table-container">
                            <table className="reports-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSuggestions.map(suggestion => (
                                        <React.Fragment key={suggestion.id}>
                                            <tr className={`report-row ${suggestion.status} ${expandedSuggestions[suggestion.id] ? 'expanded' : ''}`} onClick={() => toggleSuggestionRow(suggestion.id)}>
                                                <td>{new Date(suggestion.createdAt).toLocaleDateString()} {new Date(suggestion.createdAt).toLocaleTimeString()}</td>
                                                <td className="desc-cell">{suggestion.description.substring(0, 100)}{suggestion.description.length > 100 && '...'}</td>
                                                <td>
                                                    <select 
                                                        value={suggestion.status} 
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => updateSuggestionStatus(suggestion.id, e.target.value)}
                                                        className={`status-select ${suggestion.status}`}
                                                    >
                                                        <option value="open">Open</option>
                                                        <option value="investigating">Investigating</option>
                                                        <option value="implemented">Implemented</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button className="expand-btn">{expandedSuggestions[suggestion.id] ? 'Hide' : 'View'}</button>
                                                </td>
                                            </tr>
                                            {expandedSuggestions[suggestion.id] && (
                                                <tr className="detail-row">
                                                    <td colSpan="4">
                                                        <div className="report-details">
                                                            <div className="detail-section">
                                                                <h4>Full Description</h4>
                                                                <p>{suggestion.description}</p>
                                                            </div>
                                                            <div className="detail-grid">
                                                                <div className="detail-item">
                                                                    <strong>Path:</strong> {suggestion.path || suggestion.contextData?.path || '/'}
                                                                </div>
                                                                <div className="detail-item">
                                                                    <strong>Browser:</strong> {suggestion.browser || suggestion.contextData?.browser || 'Unknown'}
                                                                </div>
                                                                <div className="detail-item">
                                                                    <strong>User ID:</strong> {suggestion.userId || 'Anonymous'}
                                                                </div>
                                                            </div>
                                                            {suggestion.contextData && (
                                                                <div className="detail-section">
                                                                    <h4>Context Data</h4>
                                                                    <pre className="json-view">
                                                                        {JSON.stringify(suggestion.contextData, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {filteredSuggestions.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="no-data">No suggestions found matching criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'users' && (
                <>
                    {loadingUsers ? <div className="admin-loading">Loading Users...</div> : (
                        <div className="reports-table-container">
                            <table className="reports-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Joined At</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} className="user-row">
                                            <td>{u.username || 'No Username'}</td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`role-badge ${u.isAdmin ? 'admin' : 'user'}`}>
                                                    {u.isAdmin ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                {!u.isAdmin && (
                                                    <button 
                                                        className={`action-btn ${u.isActive ? 'deactivate' : 'activate'}`} 
                                                        onClick={() => toggleUserStatus(u.id, u.isActive)}
                                                    >
                                                        {u.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="no-data">No users found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
