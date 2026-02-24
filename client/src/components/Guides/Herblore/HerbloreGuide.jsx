import React from 'react';
import p2pData from '../../../data/guides/herblore/herbloreP2P.json';
import ironmanData from '../../../data/guides/herblore/herbloreIronman.json';
import GuideTemplate from '../GuideTemplate';

const HerbloreGuide = () => (
    <GuideTemplate
        skillName="Herblore"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="herblore"
    />
);

export default HerbloreGuide;
