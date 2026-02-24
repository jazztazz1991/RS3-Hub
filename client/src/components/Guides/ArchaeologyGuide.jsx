import React from 'react';
import p2pData from '../../data/guides/archaeology/archaeologyP2P.json';
import ironmanData from '../../data/guides/archaeology/archaeologyIronman.json';
import GuideTemplate from './GuideTemplate';

const ArchaeologyGuide = () => (
    <GuideTemplate
        skillName="Archaeology"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="archaeology"
    />
);

export default ArchaeologyGuide;
