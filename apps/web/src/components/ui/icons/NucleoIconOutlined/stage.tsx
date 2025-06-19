import type { iconProps } from './iconProps';

function stage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.109,13.391l2.591-3.263c.19-.239,.478-.378,.783-.378h7.034c.305,0,.593,.139,.783,.378l2.591,3.263"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="10.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 9 9)"
          x="1.75"
          y="3.75"
        />
      </g>
    </svg>
  );
}

export default stage;
