import type { iconProps } from './iconProps';

function squareTable(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square table';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M8,6h8v-1.25c0-1.517-1.233-2.75-2.75-2.75h-5.25V6Z" fill="currentColor" />
        <path d="M8 7.5H16V10.5H8z" fill="currentColor" />
        <path d="M2 7.5H6.5V10.5H2z" fill="currentColor" />
        <path d="M6.5,12H2v1.25c0,1.517,1.233,2.75,2.75,2.75h1.75v-4Z" fill="currentColor" />
        <path d="M8,12v4h5.25c1.517,0,2.75-1.233,2.75-2.75v-1.25H8Z" fill="currentColor" />
        <path d="M6.5,6V2h-1.75c-1.517,0-2.75,1.233-2.75,2.75v1.25H6.5Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default squareTable;
