import type { iconProps } from './iconProps';

function trees(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px trees';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.75 16.25L6.75 13.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.9975 13.25L16.5 13.25 13.324 8.25 15.5 8.25 11.25 1.75 9 5.1912"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12 13.25L8.824 8.25 11 8.25 6.75 1.75 2.5 8.25 4.676 8.25 1.5 13.25 12 13.25z"
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

export default trees;
