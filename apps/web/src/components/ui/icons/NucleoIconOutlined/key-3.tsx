import type { iconProps } from './iconProps';

function key3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px key 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.75 9.752L8.75 1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 2.75L12.25 2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 5.75L11.578 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="8.75"
          cy="13"
          fill="none"
          r="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="8.75" cy="13.5" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default key3;
