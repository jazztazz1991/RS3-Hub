import React from 'react';
import p2pData from '../../data/guides/woodcutting/woodcuttingP2P.json';
import ironmanData from '../../data/guides/woodcutting/woodcuttingIronman.json';
import GuideTemplate from './GuideTemplate';

const WoodcuttingGuide = () => (
    <GuideTemplate
        skillName="Woodcutting"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="woodcutting"
    />
);

export default WoodcuttingGuide;
