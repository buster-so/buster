import type { iconProps } from './iconProps';

function dietCalendar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px diet calendar';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.908,11.624c-.912-.724-1.938-.128-2.805-.128s-1.789-.632-2.805,.128-1.114,2.678,.014,4.457c1.083,1.708,2.175,1.038,2.792,1.038s1.709,.671,2.792-1.038c1.127-1.779,.851-3.794,.012-4.457Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.667,8h0c.184,0,.333,.149,.333,.333h0c0,.92-.747,1.667-1.667,1.667h0c-.184,0-.333-.149-.333-.333h0c0-.92,.747-1.667,1.667-1.667Z"
          fill="currentColor"
        />
        <path
          d="M7.25,15.25H3.75c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2H13.25c1.105,0,2,.895,2,2v1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 2.75L5.25 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 2.75L11.75 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 6.25L15.25 6.25"
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

export default dietCalendar;
