import React from 'react';
import p2pData from '../../data/guides/necromancy/necromancyP2P.json';
import ironmanData from '../../data/guides/necromancy/necromancyIronman.json';
import GuideTemplate from './GuideTemplate';

const NecromancyGuide = () => (
    <GuideTemplate
        skillName="Necromancy"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="necromancy"
    />
);

export default NecromancyGuide;
