import React from 'react';
import p2pData from '../../../data/guides/slayer/slayerP2P.json';
import ironmanData from '../../../data/guides/slayer/slayerIronman.json';
import GuideTemplate from '../GuideTemplate';

const SlayerGuide = () => (
    <GuideTemplate
        skillName="Slayer"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="slayer"
    />
);

export default SlayerGuide;
