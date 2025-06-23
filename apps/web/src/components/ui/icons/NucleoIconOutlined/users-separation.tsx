import type { iconProps } from './iconProps';

function usersSeparation(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users separation';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 2L9 16"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4,9.25h0c1.243,0,2.25,1.007,2.25,2.25v2.25c0,.552-.448,1-1,1H2.75c-.552,0-1-.448-1-1v-2.25c0-1.243,1.007-2.25,2.25-2.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14,9.25h0c-1.243,0-2.25,1.007-2.25,2.25v2.25c0,.552,.448,1,1,1h2.5c.552,0,1-.448,1-1v-2.25c0-1.243-1.007-2.25-2.25-2.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="4"
          cy="5.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14"
          cy="5.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default usersSeparation;
