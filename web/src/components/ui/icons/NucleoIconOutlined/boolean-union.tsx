import type { iconProps } from './iconProps';

function booleanUnion(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px boolean union';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.25,6.75h-3V3.75c0-.552-.448-1-1-1H3.75c-.552,0-1,.448-1,1v6.5c0,.552,.448,1,1,1h3v3c0,.552,.448,1,1,1h6.5c.552,0,1-.448,1-1V7.75c0-.552-.448-1-1-1Z"
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

export default booleanUnion;
