import type { iconProps } from './iconProps';

function messageClip(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px message clip';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25,9.304V4.25c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v7c0,1.104,.895,2,2,2h2v3l3.5-2.8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,13.25v-2c0-.69-.56-1.25-1.25-1.25h0c-.69,0-1.25,.56-1.25,1.25v2.5c0,1.381,1.119,2.5,2.5,2.5h0c1.381,0,2.5-1.119,2.5-2.5v-2"
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

export default messageClip;
