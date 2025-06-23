import type { iconProps } from './iconProps';

function textPrompt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text prompt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8 11.75L2.75 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.205 7.75L2.75 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 3.75L2.75 3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 10.25L14.25 12.25 16.25 13.25 14.25 14.25 13.25 16.25 12.25 14.25 10.25 13.25 12.25 12.25 13.25 10.25z"
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

export default textPrompt;
