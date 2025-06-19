import type { iconProps } from './iconProps';

function userPin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="4.5"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="14.25" cy="13.25" fill="currentColor" r=".75" />
        <path
          d="M10.249,9.891c-.405-.083-.819-.141-1.249-.141-2.551,0-4.739,1.53-5.709,3.72-.365,.825,.087,1.774,.947,2.045,1.225,.386,2.846,.734,4.762,.734,.303,0,.585-.022,.873-.038"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,17s-2.75-1.509-2.75-3.75c0-1.519,1.231-2.75,2.75-2.75s2.75,1.231,2.75,2.75c0,2.241-2.75,3.75-2.75,3.75Z"
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

export default userPin;
