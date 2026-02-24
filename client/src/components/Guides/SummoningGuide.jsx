import React from 'react';
import p2pData from '../../data/guides/summoning/summoningP2P.json';
import ironmanData from '../../data/guides/summoning/summoningIronman.json';
import GuideTemplate from './GuideTemplate';

const SummoningGuide = () => (
    <GuideTemplate
        skillName="Summoning"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="summoning"
    />
);

export default SummoningGuide;
