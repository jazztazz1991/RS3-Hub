import React from 'react';
import p2pData from '../../data/guides/dungeoneering/dungeoneeringP2P.json';
import ironmanData from '../../data/guides/dungeoneering/dungeoneeringIronman.json';
import GuideTemplate from './GuideTemplate';

const DungeoneeringGuide = () => (
    <GuideTemplate
        skillName="Dungeoneering"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="dungeoneering"
    />
);

export default DungeoneeringGuide;
