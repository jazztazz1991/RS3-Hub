import React from 'react';
import p2pData from '../../data/guides/divination/divinationP2P.json';
import ironmanData from '../../data/guides/divination/divinationIronman.json';
import GuideTemplate from './GuideTemplate';

const DivinationGuide = () => (
    <GuideTemplate
        skillName="Divination"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="divination"
    />
);

export default DivinationGuide;
