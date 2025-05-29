import type { iconProps } from './iconProps';

function rectLayoutGrid(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rect layout grid';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M8.5,5.5h8v-.75c0-1.517-1.233-2.75-2.75-2.75h-5.25v3.5Z" fill="currentColor" />
        <path d="M8.5 7H16.5V11H8.5z" fill="currentColor" />
        <path
          d="M7,2h-2.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h2.75V2Z"
          fill="currentColor"
        />
        <path d="M8.5,12.5v3.5h5.25c1.517,0,2.75-1.233,2.75-2.75v-.75H8.5Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default rectLayoutGrid;
