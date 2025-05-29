import type { iconProps } from './iconProps';

function doNotWash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px do not wash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.65,7.886c.5,.213,1.044,.325,1.6,.322"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,8.209c1.207,.003,2.353-.531,3.125-1.459,.995,1.187,2.521,1.664,3.938,1.377"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.935,14.065c-.612-.284-1.061-.87-1.145-1.579L1.75,3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.043,5.493l-.833,6.994c-.12,1.006-.973,1.764-1.986,1.764H7.285"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
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

export default doNotWash;
