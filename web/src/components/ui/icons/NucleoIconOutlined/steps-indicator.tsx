import type { iconProps } from './iconProps';

function stepsIndicator(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px steps indicator';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="3.5"
          cy="7.25"
          fill="none"
          r="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.5" cy="7.25" fill="currentColor" r=".75" />
        <circle
          cx="14.5"
          cy="7.25"
          fill="none"
          r="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 7.25L9.5 7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,16.25v-4s-.458,.806-1.431,.992"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.028,13.249c.188-.67,.838-1.009,1.539-.999s1.361,.325,1.403,1.026-.702,1.173-1.471,1.487-1.408,.607-1.471,1.487h2.944"
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

export default stepsIndicator;
