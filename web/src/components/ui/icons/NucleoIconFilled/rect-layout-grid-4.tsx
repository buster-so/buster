import type { iconProps } from './iconProps';

function rectLayoutGrid4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rect layout grid 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M11,8H1v5.25c0,1.517,1.233,2.75,2.75,2.75h7.25V8Z" fill="currentColor" />
        <path
          d="M17,6.5v-1.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v1.75H17Z"
          fill="currentColor"
        />
        <path d="M12.5,8v8h1.75c1.517,0,2.75-1.233,2.75-2.75v-5.25h-4.5Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default rectLayoutGrid4;
