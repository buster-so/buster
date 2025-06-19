import type { iconProps } from './iconProps';

function chatBubbleWriting(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble writing';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.75,2.75H4.25c-1.105,0-2,.895-2,2v11.5l3.75-3h7.75c1.105,0,2-.895,2-2V4.75c0-1.105-.895-2-2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,9c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
          opacity=".75"
        />
        <path d="M5.5,9c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z" fill="currentColor" />
        <path
          d="M12.5,9c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
          opacity=".5"
        />
      </g>
    </svg>
  );
}

export default chatBubbleWriting;
