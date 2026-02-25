import p2pData from '../../../data/guides/ranged/rangedP2P.json';
import ironmanData from '../../../data/guides/ranged/rangedIronman.json';
import GuideTemplate from '../GuideTemplate';

const RangedGuide = () => (
    <GuideTemplate
        skillName="Ranged"
        p2pData={p2pData}
        ironmanData={ironmanData}
    />
);

export default RangedGuide;
