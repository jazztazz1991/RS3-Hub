import React from 'react';
import p2pData from '../../data/guides/magic/magicP2P.json';
import ironmanData from '../../data/guides/magic/magicIronman.json';
import GuideTemplate from './GuideTemplate';

const MagicGuide = () => (
    <GuideTemplate
        skillName="Magic"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="magic"
    />
);

export default MagicGuide;
