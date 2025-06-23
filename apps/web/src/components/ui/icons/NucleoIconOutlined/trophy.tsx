import type { iconProps } from './iconProps';

function trophy(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px trophy';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.5,12.25s0,2.938,3.75,4H4.75c3.75-1.062,3.75-4,3.75-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.286,9C1.469,9,1.75,3.75,1.75,3.75H3.987"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.714,9c3.818,0,3.536-5.25,3.536-5.25h-2.237"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14,1.75c-.625,6.531-2.281,10.219-4.75,10.5h-.25s-.25,0-.25,0c-2.469-.281-4.125-3.969-4.75-10.5H14Z"
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

export default trophy;
