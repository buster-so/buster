import type { iconProps } from './iconProps';

function footsteps(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px footsteps';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.654,1.768c1.185-.181,2.415,.981,3.196,3.153s.006,3.758,.351,4.94c.365,1.25,1.222,3.252-.432,3.776-1.6,.507-2.104-.741-2.567-2.885-.217-1.006-2.21-2.575-2.403-4.567s.123-4.153,1.854-4.417Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.202 10.753L7.201 9.862"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.346,4.268c-1.185-.181-2.415,.981-3.196,3.153s-.006,3.758-.351,4.94c-.365,1.25-1.222,3.252,.432,3.776,1.6,.507,2.104-.741,2.567-2.885,.217-1.006,2.21-2.575,2.403-4.567s-.123-4.153-1.854-4.417Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.798 13.253L10.799 12.362"
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

export default footsteps;
