import type { iconProps } from './iconProps';

function mobile2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mobile 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="14.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="3.75"
          y="1.75"
        />
        <path
          d="M7.75 1.75L7.75 2.75 10.25 2.75 10.25 1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="13" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default mobile2;
