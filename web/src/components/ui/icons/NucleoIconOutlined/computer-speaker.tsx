import type { iconProps } from './iconProps';

function computerSpeaker(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px computer speaker';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="12" cy="6" fill="currentColor" r="1" />
        <circle
          cx="12"
          cy="10.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25,10.75H2.75c-.552,0-1-.448-1-1V5.25c0-.552,.448-1,1-1h2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25,13.25c-1.542,0-2.5,.75-2.5,.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="12.5"
          width="8.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.75"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default computerSpeaker;
