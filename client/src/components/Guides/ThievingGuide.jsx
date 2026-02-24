import React from 'react';
import p2pData from '../../data/guides/thieving/thievingP2P.json';
import ironmanData from '../../data/guides/thieving/thievingIronman.json';
import GuideTemplate from './GuideTemplate';

const ThievingGuide = () => (
    <GuideTemplate
        skillName="Thieving"
        p2pData={p2pData}
        ironmanData={ironmanData}
        calculatorSlug="thieving"
    />
);

export default ThievingGuide;
