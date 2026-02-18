import React, { useState } from 'react';
import axios from 'axios';
import './ReportModal.css'; // We'll create this next

const ReportModal = ({ isOpen, onClose, contextData = {}, defaultType = 'bug' }) => {
    const [type, setType] = useState(defaultType);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error

    if (!isOpen) return null;

    const getBrowserInfo = () => {
        const ua = navigator.userAgent;
        let browser = "Unknown";
        if (ua.indexOf("Firefox") > -1) {
            browser = "Mozilla Firefox";
        } else if (ua.indexOf("SamsungBrowser") > -1) {
            browser = "Samsung Internet";
        } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
            browser = "Opera";
        } else if (ua.indexOf("Trident") > -1) {
            browser = "Microsoft Internet Explorer";
        } else if (ua.indexOf("Edge") > -1) {
            browser = "Microsoft Edge";
        } else if (ua.indexOf("Chrome") > -1) {
            browser = "Google Chrome";
        } else if (ua.indexOf("Safari") > -1) {
            browser = "Apple Safari";
        }
        return browser;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('idle');

        try {
            await axios.post('/api/reports', {
                type,
                description,
                contextData,
                path: window.location.pathname,
                browser: getBrowserInfo() // Send simplified browser name
            });
            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                setDescription('');
            }, 2000);
        } catch (err) {
            console.error(err);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="report-modal-overlay">
            <div className="report-modal">
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h3>Report Issue</h3>
                
                {status === 'success' ? (
                    <div className="success-message">
                        ✅ Report submitted! Thank you.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Type</label>
                            <select value={type} onChange={(e) => setType(e.target.value)}>
                                <option value="bug">Bug</option>
                                <option value="data_error">Data Error</option>
                                <option value="suggestion">Suggestion</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the issue... (Current page data will be automatically included)"
                                required
                                rows="5"
                            />
                        </div>

                        {status === 'error' && (
                            <p className="error-message">Failed to submit report. Please try again.</p>
                        )}

                        <div className="modal-actions">
                            <button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : 'Submit Report'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReportModal;
