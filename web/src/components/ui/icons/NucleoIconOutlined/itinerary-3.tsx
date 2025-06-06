import type { iconProps } from './iconProps';

function itinerary3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px itinerary 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="4"
          width="4"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="11.75"
        />
        <circle
          cx="4.75"
          cy="4.25"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.25,4.25h4c1.105,0,2,.895,2,2v5.5c0,1.105-.895,2-2,2h-4"
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

export default itinerary3;
