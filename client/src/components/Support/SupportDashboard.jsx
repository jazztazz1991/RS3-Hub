import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './SupportDashboard.css';

const SupportDashboard = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('issues'); // 'issues' or 'suggestions'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reportsRes, suggestionsRes] = await Promise.all([
                axios.get('/api/reports'),
                axios.get('/api/suggestions')
            ]);
            setReports(reportsRes.data);
            setSuggestions(suggestionsRes.data);
        } catch (err) {
            console.error('Error fetching support data', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return '#3498db';
            case 'in-progress': return '#f1c40f';
            case 'resolved': return '#2ecc71';
            case 'closed': return '#95a5a6';
            default: return '#bdc3c7';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="support-dashboard">
            <h2>Support & Feedback</h2>
            
            <div className="support-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
                    onClick={() => setActiveTab('issues')}
                >
                    My Issues ({reports.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('suggestions')}
                >
                    Suggestions ({suggestions.length})
                </button>
            </div>

            <div className="support-content">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <>
                        {activeTab === 'issues' && (
                            <div className="issues-list">
                                <h3>My Reported Issues</h3>
                                {reports.length === 0 ? (
                                    <p className="empty-state">No issues reported yet.</p>
                                ) : (
                                    reports.map(report => (
                                        <div key={report.id} className="support-card">
                                            <div className="card-header">
                                                <span className="type-badge">{report.type}</span>
                                                <span className="status-badge" style={{backgroundColor: getStatusColor(report.status)}}>
                                                    {report.status}
                                                </span>
                                                <span className="date">{formatDate(report.createdAt)}</span>
                                            </div>
                                            <p className="description">{report.description}</p>
                                            {report.adminResponse && (
                                                <div className="admin-response">
                                                    <strong>Admin Response:</strong>
                                                    <p>{report.adminResponse}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'suggestions' && (
                            <div className="suggestions-list">
                                <div className="suggestions-section">
                                    <h3>Community Suggestions</h3>
                                    {suggestions.length === 0 ? (
                                        <p className="empty-state">No suggestions yet.</p>
                                    ) : (
                                        suggestions.map(suggestion => (
                                            <div key={suggestion.id} className={`support-card ${suggestion.userId === user.id ? 'mine' : ''}`}>
                                                <div className="card-header">
                                                    <span className="status-badge" style={{backgroundColor: getStatusColor(suggestion.status)}}>
                                                        {suggestion.status}
                                                    </span>
                                                    <span className="date">{formatDate(suggestion.createdAt)}</span>
                                                    {suggestion.userId === user.id && <span className="mine-badge">My Suggestion</span>}
                                                </div>
                                                <p className="description">{suggestion.description}</p>
                                                {suggestion.adminResponse && (
                                                    <div className="admin-response">
                                                        <strong>Dev Response:</strong>
                                                        <p>{suggestion.adminResponse}</p>
                                                    </div>
                                                )}
                                                <div className="votes">
                                                    {/* Placeholder for voting later */}
                                                    {/* <span>👍 {suggestion.votes || 0}</span> */}
                                                </div>
                                            </div>
                                        ))
                                    )}    
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SupportDashboard;
