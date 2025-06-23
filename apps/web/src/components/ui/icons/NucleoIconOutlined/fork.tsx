import type { iconProps } from './iconProps';

function fork(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px fork';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 8.75L9 15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 2.25L9 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5,2.25l.144,3.752c.058,1.5-1.143,2.748-2.644,2.748h0c-1.501,0-2.702-1.248-2.644-2.748l.144-3.752"
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

export default fork;
