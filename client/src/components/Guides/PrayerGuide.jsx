import React from 'react';
import p2pData from '../../data/guides/prayer/prayerP2P.json';
import ironmanData from '../../data/guides/prayer/prayerIronman.json';
import GuideTemplate from './GuideTemplate';

const PrayerGuide = () => (
    <GuideTemplate
        skillName="Prayer"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="prayer"
    />
);

export default PrayerGuide;
