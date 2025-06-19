import type { iconProps } from './iconProps';

function animationBounce(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px animation bounce';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="13.75"
          cy="6.25"
          fill="none"
          r="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,3.75c.74,.897,1.6,2.131,2.312,3.719,1.229,2.74,1.437,5.239,1.438,6.781,.102-.891,.394-2.404,1.354-4,.711-1.181,1.537-1.992,2.146-2.5"
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

export default animationBounce;
