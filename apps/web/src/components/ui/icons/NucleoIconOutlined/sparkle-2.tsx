import type { iconProps } from './iconProps';

function sparkle2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sparkle 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75 10.25L5.6 12.4 7.75 13.25 5.6 14.1 4.75 16.25 3.9 14.1 1.75 13.25 3.9 12.4 4.75 10.25z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 1.75L12.667 5.333 16.25 6.75 12.667 8.167 11.25 11.75 9.833 8.167 6.25 6.75 9.833 5.333 11.25 1.75z"
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

export default sparkle2;
