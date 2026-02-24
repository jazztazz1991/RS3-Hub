import React from 'react';
import p2pData from '../../data/guides/fishing/fishingP2P.json';
import ironmanData from '../../data/guides/fishing/fishingIronman.json';
import GuideTemplate from './GuideTemplate';

const FishingGuide = () => (
    <GuideTemplate
        skillName="Fishing"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="fishing"
    />
);

export default FishingGuide;
