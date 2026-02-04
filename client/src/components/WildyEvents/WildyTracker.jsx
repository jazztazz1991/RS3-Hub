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
    const now = new Date();

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatUTC = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    };

    // Sort events by time
    const sortedEvents = Object.entries(specialEvents)
        .map(([name, time]) => ({ name, time }))
        .sort((a, b) => a.time - b.time);

    // Determine Status
    // Next Event: Smallest positive difference from now
    // Active Event: Started less than 5 minutes ago
    const activeThreshold = 5 * 60 * 1000; // 5 mins in ms

    let nextEventIndex = -1;
    let activeEventIndex = -1;

    // Find the first event in the future (or very recently started)
    for (let i = 0; i < sortedEvents.length; i++) {
        const diff = sortedEvents[i].time - now;
        
        // Check if active (started within last 5 mins)
        // diff is negative if started in past. e.g. started 1 min ago = -60000
        if (diff <= 0 && Math.abs(diff) < activeThreshold) {
            activeEventIndex = i;
        }

        // Check for next (first one with positive diff)
        if (diff > 0) {
            nextEventIndex = i;
            break; // Found the next one
        }
    }

    return (
        <div className="wildy-tracker">
            <div className="tracker-header">
                <h2>Special Flash Events</h2>
            </div>
            <div className="events-list">
                {sortedEvents.map(({ name, time }, index) => {
                    const isActive = index === activeEventIndex;
                    const isNext = index === nextEventIndex;
                    
                    let statusClass = '';
                    let statusLabel = null;

                    if (isActive) {
                        statusClass = 'active-event';
                        statusLabel = <span style={{color: '#ff4444', fontSize: '0.8rem', fontWeight: 'bold'}}>HAPPENING NOW</span>;
                    } else if (isNext) {
                        statusClass = 'next-event';
                        statusLabel = <span style={{color: '#ffd700', fontSize: '0.8rem'}}>UP NEXT</span>;
                    }

                    return (
                        <div key={name} className={`flash-event-item ${statusClass}`}>
                            <div className="event-info">
                                <div className="event-name">{name}</div>
                                {statusLabel}
                            </div>
                            <div className="event-times">
                                <span className="time-utc" title="UTC Time">{formatUTC(time)} UTC</span>
                                <span className="time-local" title="Local Time">{formatTime(time)} Local</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WildyTracker;
