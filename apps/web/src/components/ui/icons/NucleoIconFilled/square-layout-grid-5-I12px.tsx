import type { iconProps } from './iconProps';

function squareLayoutGrid5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square layout grid 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M8,6.5h8v-1.75c0-1.517-1.233-2.75-2.75-2.75h-5.25V6.5Z" fill="currentColor" />
        <path d="M6.5,6.5V2h-1.75c-1.517,0-2.75,1.233-2.75,2.75v1.75H6.5Z" fill="currentColor" />
        <path d="M8,8v8h5.25c1.517,0,2.75-1.233,2.75-2.75v-5.25H8Z" fill="currentColor" />
        <path d="M6.5,8H2v5.25c0,1.517,1.233,2.75,2.75,2.75h1.75V8Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default squareLayoutGrid5;
