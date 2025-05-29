import type { iconProps } from './iconProps';

function stars2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stars 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.852 3.842L12.323 3.628 13.25 1.75 14.177 3.628 16.25 3.93 14.75 5.392 15.025 6.995"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.148 3.842L5.677 3.628 4.75 1.75 3.823 3.628 1.75 3.93 3.25 5.392 2.975 6.995"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 5.739L10.545 8.87 14 9.372 11.5 11.809 12.09 15.25 9 13.625 5.91 15.25 6.5 11.809 4 9.372 7.455 8.87 9 5.739z"
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

export default stars2;
