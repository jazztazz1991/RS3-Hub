// Anchor: February 5, 2024 at 07:00 UTC = Spider Swarm (Index 0)
// This rotation is fixed based on Game Updates.
// The cycle repeats every 14 hours.
// Monday 07:00 UTC is Spider Swarm.
// Confirmed against user reference: Star @ 20:00 -> Spider @ 01:00 (+5h)
const ANCHOR_DATE = new Date(Date.UTC(2024, 1, 5, 7, 0, 0)); // Month is 0-indexed (1 = Feb)

export const WILDY_EVENTS = [
    { name: 'Spider Swarm', isSpecial: false },
    { name: 'Unnatural Outcrop', isSpecial: false },
    { name: 'Stryke the Wyrm', isSpecial: true },
    { name: 'Demon Stragglers', isSpecial: false },
    { name: 'Butterfly Swarm', isSpecial: false },
    { name: 'King Black Dragon Rampage', isSpecial: true },
    { name: 'Forgotten Soldiers', isSpecial: false },
    { name: 'Surprising Seedlings', isSpecial: false },
    { name: 'Hellhound Pack', isSpecial: false },
    { name: 'Infernal Star', isSpecial: true },
    { name: 'Lost Souls', isSpecial: false },
    { name: 'Ramokee Incursion', isSpecial: false },
    { name: 'Displaced Energy', isSpecial: false },
    { name: 'Evil Bloodwood Tree', isSpecial: true }
];

export const getNextEvents = () => {
    const now = new Date();
    const msPerHour = 60 * 60 * 1000;
    
    // Calculate hours passed since anchor
    // We use Math.floor to target the *current* active hour slot
    const diffMs = now.getTime() - ANCHOR_DATE.getTime();
    const hoursPassed = Math.floor(diffMs / msPerHour);
    
    // Calculate current event index
    // Using positive modulo logic for safety
    const currentEventIndex = ((hoursPassed % 14) + 14) % 14;
    
    // Calculate the start of the next hour
    const nextHour = new Date(now);
    nextHour.setMinutes(0, 0, 0);
    nextHour.setMilliseconds(0);
    // Move to next hour
    nextHour.setHours(nextHour.getHours() + 1);
    
    const specialTypes = WILDY_EVENTS.filter(e => e.isSpecial).map(e => e.name);
    const result = {};
    
    // For each special event type, find the NEXT occurrence from 'nextHour' onwards
    specialTypes.forEach(specialName => {
        // Look ahead 1-14 hours
        for (let i = 0; i < 14; i++) {
            // events match 'nextHour + i hours'
            // The event at 'nextHour' corresponds to index (currentEventIndex + 1)
            const futureIndex = (currentEventIndex + 1 + i) % 14;
            
            if (WILDY_EVENTS[futureIndex].name === specialName) {
                // Found it.
                // Time is nextHour + i hours
                const eventTime = new Date(nextHour.getTime() + (i * msPerHour));
                result[specialName] = eventTime;
                break;
            }
        }
    });

    const nextEventIndex = (currentEventIndex + 1) % 14;
    const nextEvent = WILDY_EVENTS[nextEventIndex];
    const nextEventTime = nextHour;

    return {
        nextEvent,
        nextEventTime,
        specialEvents: result
    };
};

export const checkNotification = () => {
    const { nextEvent, nextEventTime } = getNextEvents();
    
    if (!nextEvent.isSpecial) return { shouldNotify: false };

    const now = new Date();
    const diff = nextEventTime - now;
    const minutes = Math.floor(diff / 60000);

    // Notify if within 15 mins (0-15 inclusive)
    if (minutes <= 15 && minutes >= 0) {
        return {
            shouldNotify: true,
            event: nextEvent,
            time: nextEventTime,
            minutesUntil: minutes
        };
    }
    
    return { shouldNotify: false };
};
