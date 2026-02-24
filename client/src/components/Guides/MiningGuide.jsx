import React from 'react';
import p2pData from '../../data/guides/mining/miningP2P.json';
import ironmanData from '../../data/guides/mining/miningIronman.json';
import GuideTemplate from './GuideTemplate';

const MiningGuide = () => (
    <GuideTemplate
        skillName="Mining"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="mining"
    />
);

export default MiningGuide;
