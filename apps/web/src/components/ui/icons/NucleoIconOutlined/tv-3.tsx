import type { iconProps } from './iconProps';

function tv3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tv 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12 0.75L9 3.75 6.75 1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="10.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="3.75"
        />
        <rect
          height="6"
          width="7"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="4"
          y="6"
        />
        <circle cx="13" cy="7" fill="currentColor" r="1" strokeWidth="0" />
        <circle cx="13" cy="10" fill="currentColor" r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default tv3;
