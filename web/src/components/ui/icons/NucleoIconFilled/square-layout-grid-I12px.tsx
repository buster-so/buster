import type { iconProps } from './iconProps';

function squareLayoutGrid(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square layout grid';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M8.25,8.25V2h-3.5c-1.517,0-2.75,1.233-2.75,2.75v3.5h6.25Z" fill="currentColor" />
        <path
          d="M9.75,8.25h6.25v-3.5c0-1.517-1.233-2.75-2.75-2.75h-3.5v6.25Z"
          fill="currentColor"
        />
        <path
          d="M9.75,9.75v6.25h3.5c1.517,0,2.75-1.233,2.75-2.75v-3.5h-6.25Z"
          fill="currentColor"
        />
        <path d="M8.25,9.75H2v3.5c0,1.517,1.233,2.75,2.75,2.75h3.5v-6.25Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default squareLayoutGrid;
