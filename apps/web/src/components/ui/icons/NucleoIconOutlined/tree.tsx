import type { iconProps } from './iconProps';

function tree(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tree';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 16.25L9 13.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75 13.25L11.074 8.25 13.75 8.25 9 1.75 4.25 8.25 6.926 8.25 3.25 13.25 14.75 13.25z"
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

export default tree;
