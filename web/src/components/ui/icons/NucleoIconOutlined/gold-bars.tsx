import type { iconProps } from './iconProps';

function goldBars(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gold bars';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.048,9.25h3.404c.467,0,.872,.323,.975,.778l1.073,4.722H1l1.073-4.722c.103-.455,.508-.778,.975-.778Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.548,9.25h3.404c.467,0,.872,.323,.975,.778l1.073,4.722h-7.5l1.073-4.722c.103-.455,.508-.778,.975-.778Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.298,3.75h3.404c.467,0,.872,.323,.975,.778l1.073,4.722H5.25l1.073-4.722c.103-.455,.508-.778,.975-.778Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.5 14.75L9.5 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.993,3.769l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256s.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356Z"
          fill="currentColor"
        />
        <path
          d="M17.658,2.026l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z"
          fill="currentColor"
        />
        <circle cx="7.25" cy=".75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default goldBars;
