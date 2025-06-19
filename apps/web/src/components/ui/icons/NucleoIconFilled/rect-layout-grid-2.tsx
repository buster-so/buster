import type { iconProps } from './iconProps';

function rectLayoutGrid2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rect layout grid 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M1.5 7H9.5V11H1.5z" fill="currentColor" />
        <path d="M9.5,5.5V2H4.25c-1.517,0-2.75,1.233-2.75,2.75v.75H9.5Z" fill="currentColor" />
        <path d="M9.5,12.5H1.5v.75c0,1.517,1.233,2.75,2.75,2.75h5.25v-3.5Z" fill="currentColor" />
        <path
          d="M13.75,2h-2.75v14h2.75c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default rectLayoutGrid2;
