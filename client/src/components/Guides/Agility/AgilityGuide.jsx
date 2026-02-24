import React from 'react';
import p2pData from '../../../data/guides/agility/agilityP2P.json';
import ironmanData from '../../../data/guides/agility/agilityIronman.json';
import GuideTemplate from '../GuideTemplate';

const AgilityGuide = () => (
    <GuideTemplate
        skillName="Agility"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="agility"
    />
);

export default AgilityGuide;
