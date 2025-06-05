import type { iconProps } from './iconProps';

function toolArrow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tool arrow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75 15.25L11.722 6.278"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.958 4.514L15.25 2.75 13.486 8.042 9.958 4.514z"
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

export default toolArrow;
