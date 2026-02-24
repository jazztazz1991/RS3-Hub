import React from 'react';
import p2pData from '../../data/guides/smithing/smithingP2P.json';
import ironmanData from '../../data/guides/smithing/smithingIronman.json';
import GuideTemplate from './GuideTemplate';

const SmithingGuide = () => (
    <GuideTemplate
        skillName="Smithing"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="smithing"
    />
);

export default SmithingGuide;
