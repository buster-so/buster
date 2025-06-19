import type { iconProps } from './iconProps';

function golfFlag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px golf flag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,8.75c4.004,0,7.25,1.455,7.25,3.25s-3.246,3.25-7.25,3.25-7.25-1.455-7.25-3.25c0-.824,.684-1.576,1.811-2.149"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25 11.25L6.25 1.75 11.25 4 6.25 6"
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

export default golfFlag;
