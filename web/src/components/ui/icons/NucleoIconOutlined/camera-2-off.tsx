import type { iconProps } from './iconProps';

function camera2Off(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px camera 2 off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.285,14.25h6.965c1.105,0,2-.895,2-2V5.75c0-.138-.014-.273-.041-.403"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,3.75H3.75c-1.105,0-2,.895-2,2v6.5c0,1.105,.895,2,2,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.62,10.379c-.236-.405-.37-.877-.37-1.379,0-1.519,1.231-2.75,2.75-2.75,.503,0,.974,.135,1.379,.37"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.742,8.793c.005,.068,.008,.137,.008,.207,0,1.519-1.231,2.75-2.75,2.75-.072,0-.144-.003-.214-.008"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 1.25L6.75 1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="4.25" cy="6.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default camera2Off;
