import type { iconProps } from './iconProps';

function gameConsoleHandheld(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px game console handheld';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.25,2.25H13.75c.552,0,1,.448,1,1V12.75c0,1.656-1.344,3-3,3H4.25c-.552,0-1-.448-1-1V3.25c0-.552,.448-1,1-1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 4.75H12.25V8.75H5.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 11L7.25 13.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.5 12.25L6 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="11.25" cy="13.25" fill="currentColor" r=".75" />
        <circle cx="12.25" cy="11.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default gameConsoleHandheld;
