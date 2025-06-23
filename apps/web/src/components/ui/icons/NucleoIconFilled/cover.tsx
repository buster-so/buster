import type { iconProps } from './iconProps';

function cover(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cover';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m13.75,2H4.25c-1.5166,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h9.5c1.5166,0,2.75-1.2334,2.75-2.75V4.75c0-1.5166-1.2334-2.75-2.75-2.75Zm.25,6.25c0,.4141-.3359.75-.75.75H4.75c-.4141,0-.75-.3359-.75-.75v-3c0-.4141.3359-.75.75-.75h8.5c.4141,0,.75.3359.75.75v3Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default cover;
