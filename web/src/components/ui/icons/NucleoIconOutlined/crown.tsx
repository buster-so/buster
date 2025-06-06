import type { iconProps } from './iconProps';

function crown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px crown';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="9" cy="2.25" fill="currentColor" r="1" />
        <circle cx="2" cy="5" fill="currentColor" r="1" />
        <circle cx="16" cy="5" fill="currentColor" r="1" />
        <path
          d="M14.155,11.937l.845-4.437-3.25,2-2.75-4.5-2.75,4.5-3.25-2,.845,4.437c.09,.472,.502,.813,.982,.813H13.172c.48,0,.892-.341,.982-.813Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14 15.25L4 15.25"
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

export default crown;
