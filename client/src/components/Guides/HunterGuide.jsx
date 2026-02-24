import React from 'react';
import p2pData from '../../data/guides/hunter/hunterP2P.json';
import ironmanData from '../../data/guides/hunter/hunterIronman.json';
import GuideTemplate from './GuideTemplate';

const HunterGuide = () => (
    <GuideTemplate
        skillName="Hunter"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="hunter"
    />
);

export default HunterGuide;
