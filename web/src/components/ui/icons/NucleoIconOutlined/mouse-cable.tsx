import type { iconProps } from './iconProps';

function mouseCable(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mouse cable';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,5.25v-.75c0-.966,.784-1.75,1.75-1.75h1.75c.966,0,1.75-.784,1.75-1.75h0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 8.75L9 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="1em"
          width="8.5"
          fill="none"
          rx="3.5"
          ry="3.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="4.75"
          y="5.25"
        />
      </g>
    </svg>
  );
}

export default mouseCable;
