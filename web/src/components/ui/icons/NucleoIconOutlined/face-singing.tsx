import type { iconProps } from './iconProps';

function faceSinging(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face singing';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="5.5" cy="9" fill="currentColor" r="1" />
        <circle cx="11.5" cy="9" fill="currentColor" r="1" />
        <circle
          cx="9.25"
          cy="12.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13.75"
          cy="5.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,9c0,4.004-3.246,7.25-7.25,7.25S1.25,13.004,1.25,9,4.496,1.75,8.5,1.75c.876,0,1.716,.155,2.493,.44"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,5.25V.75s.646,.896,2,1.5"
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

export default faceSinging;
