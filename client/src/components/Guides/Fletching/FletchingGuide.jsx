import React from 'react';
import p2pData from '../../../data/guides/fletching/fletchingP2P.json';
import ironmanData from '../../../data/guides/fletching/fletchingIronman.json';
import GuideTemplate from '../GuideTemplate';

const FletchingGuide = () => (
    <GuideTemplate
        skillName="Fletching"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="fletching"
    />
);

export default FletchingGuide;
