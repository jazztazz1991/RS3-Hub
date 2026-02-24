import React from 'react';
import p2pData from '../../../data/guides/farming/farmingP2P.json';
import ironmanData from '../../../data/guides/farming/farmingIronman.json';
import GuideTemplate from '../GuideTemplate';

const FarmingGuide = () => (
    <GuideTemplate
        skillName="Farming"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="farming"
    />
);

export default FarmingGuide;
