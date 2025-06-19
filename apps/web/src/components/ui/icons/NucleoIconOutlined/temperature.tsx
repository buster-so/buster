import type { iconProps } from './iconProps';

function temperature(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px temperature';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.25 12L7.25 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,10.306V4.25c0-1.381,1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5v6.056c.617,.631,1,1.492,1,2.444,0,1.933-1.567,3.5-3.5,3.5s-3.5-1.567-3.5-3.5c0-.952,.383-1.813,1-2.444Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 3.75L12.75 3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 6.75L12.75 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 9.75L12.75 9.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="7.25" cy="12.75" fill="currentColor" r="1.5" />
      </g>
    </svg>
  );
}

export default temperature;
