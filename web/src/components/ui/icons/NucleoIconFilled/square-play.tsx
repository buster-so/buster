import type { iconProps } from './iconProps';

function squarePlay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px square play';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.75.5H3.25C1.733.5.5,1.733.5,3.25v5.5c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75V3.25c0-1.517-1.233-2.75-2.75-2.75Zm-1.026,6.018l-2.308,1.385c-.403.242-.916-.048-.916-.518v-2.771c0-.47.513-.76.916-.518l2.308,1.385c.391.235.391.802,0,1.037Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default squarePlay;
