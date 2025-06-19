import type { iconProps } from './iconProps';

function msgWriting(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px msg writing';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,1.75C4.996,1.75,1.75,4.996,1.75,9c0,1.319,.358,2.552,.973,3.617,.43,.806-.053,2.712-.973,3.633,1.25,.068,2.897-.497,3.633-.973,.489,.282,1.264,.656,2.279,.848,.433,.082,.881,.125,1.338,.125,4.004,0,7.25-3.246,7.25-7.25S13.004,1.75,9,1.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,10c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
          opacity=".75"
        />
        <path
          d="M5.5,10c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M12.5,10c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
          opacity=".5"
        />
      </g>
    </svg>
  );
}

export default msgWriting;
