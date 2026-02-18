import React, { useState } from 'react';
import axios from 'axios';
import './ReportModal.css'; // Reusing the same styles for now

const SuggestionModal = ({ isOpen, onClose, contextData = {} }) => {
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
            await axios.post('/api/suggestions', {
                description,
                contextData,
                path: window.location.pathname,
                browser: getBrowserInfo()
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
                <h3>Make a Suggestion</h3>
                
                {status === 'success' ? (
                    <div className="success-message">
                        ✅ Suggestion submitted! Thank you.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What would you like to see added or changed?..."
                                required
                                rows="5"
                            />
                        </div>

                        {status === 'error' && (
                            <p className="error-message">Failed to submit suggestion. Please try again.</p>
                        )}

                        <div className="modal-actions">
                            <button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : 'Submit Suggestion'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SuggestionModal;
