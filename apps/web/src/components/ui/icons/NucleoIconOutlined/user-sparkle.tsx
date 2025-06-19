import type { iconProps } from './iconProps';

function userSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="4.5"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.239,10.181c-.697-.269-1.447-.431-2.239-.431-2.551,0-4.739,1.53-5.709,3.72-.365,.825,.087,1.774,.947,2.045,1.225,.386,2.846,.734,4.762,.734,.37,0,.719-.023,1.067-.047"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 10.75L14.75 12.75 16.75 13.75 14.75 14.75 13.75 16.75 12.75 14.75 10.75 13.75 12.75 12.75 13.75 10.75z"
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

export default userSparkle;
