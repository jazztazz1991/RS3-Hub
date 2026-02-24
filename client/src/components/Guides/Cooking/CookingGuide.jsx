import React from 'react';
import p2pData from '../../../data/guides/cooking/cookingP2P.json';
import ironmanData from '../../../data/guides/cooking/cookingIronman.json';
import GuideTemplate from '../GuideTemplate';

const CookingGuide = () => (
    <GuideTemplate
        skillName="Cooking"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="cooking"
    />
);

export default CookingGuide;
