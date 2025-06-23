import type { iconProps } from './iconProps';

function batteryAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px battery alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.75 7.75H17.25V10.25H15.75z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.04,13.267c.431-.367,.71-.907,.71-1.517V6.25c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v5.5c0,.61,.279,1.15,.71,1.517"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25,15.25h.433c.788,0,1.267-.869,.845-1.535l-2.933-4.631c-.393-.62-1.297-.62-1.69,0l-2.933,4.631c-.422,.666,.057,1.535,.845,1.535h.433"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 11.75L8.75 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="8.75" cy="16.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default batteryAlert;
