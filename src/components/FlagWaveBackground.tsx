// A faint, animated American flag — manual on/off via Admin (no dates involved).
// Pure SVG + native SMIL animation, so no client JS is needed for the ripple.
export default function FlagWaveBackground() {
  return (
    <svg
      className="flag-wave-svg"
      viewBox="0 0 190 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="flagWave" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" numOctaves="2" seed="7" result="noise">
            <animate
              attributeName="baseFrequency"
              dur="7s"
              values="0.012 0.045;0.016 0.030;0.012 0.045"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <symbol id="flagStar" overflow="visible">
          <polygon points="0.00,-2.00 0.46,-0.63 1.90,-0.62 0.74,0.24 1.18,1.62 0.00,0.78 -1.18,1.62 -0.74,0.24 -1.90,-0.62 -0.46,-0.63" fill="var(--flag-star)" />
        </symbol>
      </defs>
      <g filter="url(#flagWave)">
      <rect x="0" y="0.000" width="190" height="7.692" fill="var(--flag-stripe-red)" />
      <rect x="0" y="7.692" width="190" height="7.692" fill="var(--flag-stripe-white)" />
      <rect x="0" y="15.385" width="190" height="7.692" fill="var(--flag-stripe-red)" />
      <rect x="0" y="23.077" width="190" height="7.692" fill="var(--flag-stripe-white)" />
      <rect x="0" y="30.769" width="190" height="7.692" fill="var(--flag-stripe-red)" />
      <rect x="0" y="38.462" width="190" height="7.692" fill="var(--flag-stripe-white)" />
      <rect x="0" y="46.154" width="190" height="7.692" fill="var(--flag-stripe-red)" />
      <rect x="0" y="53.846" width="190" height="7.692" fill="var(--flag-stripe-white)" />
      <rect x="0" y="61.538" width="190" height="7.692" fill="var(--flag-stripe-red)" />
      <rect x="0" y="69.231" width="190" height="7.692" fill="var(--flag-stripe-white)" />
      <rect x="0" y="76.923" width="190" height="7.692" fill="var(--flag-stripe-red)" />
      <rect x="0" y="84.615" width="190" height="7.692" fill="var(--flag-stripe-white)" />
      <rect x="0" y="92.308" width="190" height="7.692" fill="var(--flag-stripe-red)" />
        <rect x="0" y="0" width="76.0" height="53.846" fill="var(--flag-canton)" />
        <use href="#flagStar" x="6.33" y="2.99" />
        <use href="#flagStar" x="19.00" y="2.99" />
        <use href="#flagStar" x="31.67" y="2.99" />
        <use href="#flagStar" x="44.33" y="2.99" />
        <use href="#flagStar" x="57.00" y="2.99" />
        <use href="#flagStar" x="69.67" y="2.99" />
        <use href="#flagStar" x="12.67" y="8.97" />
        <use href="#flagStar" x="25.33" y="8.97" />
        <use href="#flagStar" x="38.00" y="8.97" />
        <use href="#flagStar" x="50.67" y="8.97" />
        <use href="#flagStar" x="63.33" y="8.97" />
        <use href="#flagStar" x="6.33" y="14.96" />
        <use href="#flagStar" x="19.00" y="14.96" />
        <use href="#flagStar" x="31.67" y="14.96" />
        <use href="#flagStar" x="44.33" y="14.96" />
        <use href="#flagStar" x="57.00" y="14.96" />
        <use href="#flagStar" x="69.67" y="14.96" />
        <use href="#flagStar" x="12.67" y="20.94" />
        <use href="#flagStar" x="25.33" y="20.94" />
        <use href="#flagStar" x="38.00" y="20.94" />
        <use href="#flagStar" x="50.67" y="20.94" />
        <use href="#flagStar" x="63.33" y="20.94" />
        <use href="#flagStar" x="6.33" y="26.92" />
        <use href="#flagStar" x="19.00" y="26.92" />
        <use href="#flagStar" x="31.67" y="26.92" />
        <use href="#flagStar" x="44.33" y="26.92" />
        <use href="#flagStar" x="57.00" y="26.92" />
        <use href="#flagStar" x="69.67" y="26.92" />
        <use href="#flagStar" x="12.67" y="32.91" />
        <use href="#flagStar" x="25.33" y="32.91" />
        <use href="#flagStar" x="38.00" y="32.91" />
        <use href="#flagStar" x="50.67" y="32.91" />
        <use href="#flagStar" x="63.33" y="32.91" />
        <use href="#flagStar" x="6.33" y="38.89" />
        <use href="#flagStar" x="19.00" y="38.89" />
        <use href="#flagStar" x="31.67" y="38.89" />
        <use href="#flagStar" x="44.33" y="38.89" />
        <use href="#flagStar" x="57.00" y="38.89" />
        <use href="#flagStar" x="69.67" y="38.89" />
        <use href="#flagStar" x="12.67" y="44.87" />
        <use href="#flagStar" x="25.33" y="44.87" />
        <use href="#flagStar" x="38.00" y="44.87" />
        <use href="#flagStar" x="50.67" y="44.87" />
        <use href="#flagStar" x="63.33" y="44.87" />
        <use href="#flagStar" x="6.33" y="50.85" />
        <use href="#flagStar" x="19.00" y="50.85" />
        <use href="#flagStar" x="31.67" y="50.85" />
        <use href="#flagStar" x="44.33" y="50.85" />
        <use href="#flagStar" x="57.00" y="50.85" />
        <use href="#flagStar" x="69.67" y="50.85" />
      </g>
    </svg>
  );
}
