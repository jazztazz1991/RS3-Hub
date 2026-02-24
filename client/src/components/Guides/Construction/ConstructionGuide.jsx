import React from 'react';
import p2pData from '../../../data/guides/construction/constructionP2P.json';
import ironmanData from '../../../data/guides/construction/constructionIronman.json';
import GuideTemplate from '../GuideTemplate';

const ConstructionGuide = () => (
    <GuideTemplate
        skillName="Construction"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="construction"
    />
);

export default ConstructionGuide;
