import type { iconProps } from './iconProps';

function pos(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pos';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75,14.25h-.5c-1.105,0-2-.895-2-2V2.75c0-1.105,.895-2,2-2h7.5c1.105,0,2,.895,2,2V12.25c0,1.105-.895,2-2,2h-.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 3.25H12.25V4.25H5.75z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25,17.25H6.75c-.552,0-1-.448-1-1v-4.5h6.5v4.5c0,.552-.448,1-1,1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75 11.75L9.75 17.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6.5" cy="6.75" fill="currentColor" r=".75" />
        <circle cx="9" cy="6.75" fill="currentColor" r=".75" />
        <circle cx="11.5" cy="6.75" fill="currentColor" r=".75" />
        <circle cx="6.5" cy="9.25" fill="currentColor" r=".75" />
        <circle cx="9" cy="9.25" fill="currentColor" r=".75" />
        <circle cx="11.5" cy="9.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default pos;
