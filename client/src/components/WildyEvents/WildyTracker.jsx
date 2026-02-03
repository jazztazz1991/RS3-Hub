import React, { useState, useEffect } from 'react';
import { getNextEvents } from '../../utils/wildyEvents';
import './WildyTracker.css';

const WildyTracker = () => {
    const [events, setEvents] = useState(null);

    const updateEvents = () => {
        setEvents(getNextEvents());
    };

    useEffect(() => {
        updateEvents();
        // Update every minute (align to start of minute for better precision visually)
        const now = new Date();
        const timeToNextMinute = (60 - now.getSeconds()) * 1000;
        
        const timer1 = setTimeout(() => {
            updateEvents();
            setInterval(updateEvents, 60000);
        }, timeToNextMinute);

        return () => clearTimeout(timer1);
    }, []);

    if (!events) return <div>Loading Events...</div>;

    const { specialEvents } = events;

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatUTC = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    };

    return (
        <div className="wildy-tracker">
            <div className="tracker-header">
                <h2>Special Flash Events</h2>
            </div>
            <div className="events-list">
                {Object.entries(specialEvents)
                    .sort(([, timeA], [, timeB]) => timeA - timeB)
                    .map(([name, time]) => (
                    <div key={name} className="flash-event-item">
                        <div className="event-name">{name}</div>
                        <div className="event-times">
                            <span className="time-utc" title="UTC Time">{formatUTC(time)} UTC</span>
                            <span className="time-local" title="Local Time">{formatTime(time)} Local</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WildyTracker;
