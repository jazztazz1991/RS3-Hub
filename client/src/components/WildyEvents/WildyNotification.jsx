import React, { useState, useEffect } from 'react';
import { checkNotification } from '../../utils/wildyEvents';
import './WildyNotification.css';

const WildyNotification = () => {
    const [notification, setNotification] = useState(null);
    const [lastNotifiedTime, setLastNotifiedTime] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            const result = checkNotification();

            if (result && result.shouldNotify) {
                // Unique key for this specific event time
                const eventTimeKey = result.time.getTime();

                // Only notify if we haven't notified for this specific event instance yet
                if (lastNotifiedTime !== eventTimeKey) {
                    setNotification(result);
                    setLastNotifiedTime(eventTimeKey);
                    
                    // Auto-hide after 10 seconds
                    setTimeout(() => {
                        setNotification(null);
                    }, 10000);
                }
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(timer);
    }, [lastNotifiedTime]);

    if (!notification) return null;

    return (
        <div className="wildy-notification">
            <div className="wildy-notification-content">
                <h4>Wilderness Flash Event</h4>
                <p><strong>{notification.event.name}</strong> starts in {notification.minutesUntil} minutes!</p>
                <button onClick={() => setNotification(null)}>Dismiss</button>
            </div>
        </div>
    );
};

export default WildyNotification;
