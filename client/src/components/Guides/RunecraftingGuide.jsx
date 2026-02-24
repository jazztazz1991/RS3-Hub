import React from 'react';
import p2pData from '../../data/guides/runecrafting/runecraftingP2P.json';
import ironmanData from '../../data/guides/runecrafting/runecraftingIronman.json';
import GuideTemplate from './GuideTemplate';

const RunecraftingGuide = () => (
    <GuideTemplate
        skillName="Runecrafting"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="runecrafting"
    />
);

export default RunecraftingGuide;
