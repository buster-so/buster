import type { iconProps } from './iconProps';

function compose2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px compose 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25,8.75v4.5c0,1.105-.895,2-2,2H4.75c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,11.25s2.12-.12,2.836-.836l6.25-6.25c.552-.552,.552-1.448,0-2-.552-.552-1.448-.552-2,0l-6.25,6.25c-.716,.716-.836,2.836-.836,2.836Z"
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

export default compose2;
