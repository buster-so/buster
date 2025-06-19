import type { iconProps } from './iconProps';

function award2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px award 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.25 10.049L12.25 16.75 9 14.25 5.75 16.75 5.75 10.049"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="6.25"
          fill="none"
          r="5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default award2;
