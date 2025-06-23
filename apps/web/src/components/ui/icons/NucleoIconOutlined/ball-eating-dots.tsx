import type { iconProps } from './iconProps';

function ballEatingDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ball eating dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="13.5" cy="9" fill="currentColor" r="1" />
        <circle cx="9" cy="5" fill="currentColor" r="1" />
        <circle cx="17" cy="9" fill="currentColor" r="1" />
        <path
          d="M9,9l5.794-4.345c-1.323-1.761-3.422-2.905-5.794-2.905C4.996,1.75,1.75,4.996,1.75,9s3.246,7.25,7.25,7.25c2.372,0,4.471-1.144,5.794-2.905l-5.794-4.345Z"
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

export default ballEatingDots;
