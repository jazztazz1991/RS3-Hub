import React from 'react';
import p2pData from '../../../data/guides/crafting/craftingP2P.json';
import ironmanData from '../../../data/guides/crafting/craftingIronman.json';
import GuideTemplate from '../GuideTemplate';

const CraftingGuide = () => (
    <GuideTemplate
        skillName="Crafting"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="crafting"
    />
);

export default CraftingGuide;
