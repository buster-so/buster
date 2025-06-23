import type { iconProps } from './iconProps';

function circleKey(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,4c1.321-1.386,3.184-2.25,5.25-2.25,4.004,0,7.25,3.246,7.25,7.25s-3.246,7.25-7.25,7.25c-2.066,0-3.929-.864-5.25-2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 9L12.75 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5 9L11.5 11"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.25 9L9.25 11"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="3.75"
          cy="9"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default circleKey;
