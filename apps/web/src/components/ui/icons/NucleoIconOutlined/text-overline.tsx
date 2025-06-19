import type { iconProps } from './iconProps';

function textOverline(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text overline';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.99 15.25L9.305 5.75 8.695 5.75 5.01 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.98 12.75L12.02 12.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          id="1739897115942-5271609_color"
          d="M15.25 2.75L2.75 2.75"
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

export default textOverline;
