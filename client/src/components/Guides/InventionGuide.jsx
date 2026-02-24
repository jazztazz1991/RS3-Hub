import React from 'react';
import p2pData from '../../data/guides/invention/inventionP2P.json';
import ironmanData from '../../data/guides/invention/inventionIronman.json';
import GuideTemplate from './GuideTemplate';

const InventionGuide = () => (
    <GuideTemplate
        skillName="Invention"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="invention"
    />
);

export default InventionGuide;
