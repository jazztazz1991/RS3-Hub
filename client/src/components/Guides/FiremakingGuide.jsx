import React from 'react';
import p2pData from '../../data/guides/firemaking/firemakingP2P.json';
import ironmanData from '../../data/guides/firemaking/firemakingIronman.json';
import GuideTemplate from './GuideTemplate';

const FiremakingGuide = () => (
    <GuideTemplate
        skillName="Firemaking"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="firemaking"
    />
);

export default FiremakingGuide;
