import type { iconProps } from './iconProps';

function chartDonut3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart donut 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.348 6.348L3.875 3.875"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.348 11.652L3.875 14.125"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,9c0,2.071-1.679,3.75-3.75,3.75s-3.75-1.679-3.75-3.75,1.679-3.75,3.75-3.75c1.035,0,1.971,.419,2.65,1.096l2.473-2.477c-1.312-1.31-3.123-2.12-5.123-2.12C4.996,1.75,1.75,4.996,1.75,9s3.246,7.25,7.25,7.25,7.25-3.246,7.25-7.25h-3.5Z"
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

export default chartDonut3;
