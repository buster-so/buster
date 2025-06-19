import type { iconProps } from './iconProps';

function shadow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shadow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.54,12.585c-1.681,.358-2.79,.97-2.79,1.665,0,1.104,2.798,2,6.25,2s6.25-.896,6.25-2c0-.695-1.109-1.307-2.79-1.665"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="8"
          fill="none"
          r="5.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default shadow;
