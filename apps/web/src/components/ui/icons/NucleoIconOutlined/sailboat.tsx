import type { iconProps } from './iconProps';

function sailboat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sailboat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.75 9.25L6.25 9.25 6.25 1.75 13.75 9.25z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25 9.25L6.25 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,12.25h14.5l-1.703,2.555c-.185,.278-.498,.445-.832,.445H4.285c-.334,0-.647-.167-.832-.445l-1.703-2.555Z"
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

export default sailboat;
