import type { iconProps } from './iconProps';

function bankingMobile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px banking mobile';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="14.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="3.75"
          y="1.75"
        />
        <path
          d="M10.817,6.951c-.394-.933-1.183-1.144-1.779-1.144-.554,0-2.01,.295-1.875,1.692,.094,.981,1.019,1.346,1.827,1.49s1.981,.452,2.01,1.635c.024,1-.875,1.683-1.962,1.683-1.038,0-1.76-.404-2.038-1.317"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 5.048L9 5.693"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 12.307L9 12.952"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default bankingMobile;
