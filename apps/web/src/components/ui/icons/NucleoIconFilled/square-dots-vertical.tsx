import type { iconProps } from './iconProps';

function squareDotsVertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square dots vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-4.25,11.5c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Zm0-3.5c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Zm0-3.5c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareDotsVertical;
