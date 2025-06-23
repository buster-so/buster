import type { iconProps } from './iconProps';

function crowd(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px crowd';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="4.25"
          cy="10.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="2.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13.75"
          cy="10.5"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M.895,17c.43-1.446,1.77-2.5,3.355-2.5,1.585,0,2.925,1.054,3.355,2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.194,7.273c-.6-.484-1.363-.773-2.194-.773-.831,0-1.594,.289-2.194,.773"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.395,17c.43-1.446,1.77-2.5,3.355-2.5,1.585,0,2.925,1.054,3.355,2.5"
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

export default crowd;
