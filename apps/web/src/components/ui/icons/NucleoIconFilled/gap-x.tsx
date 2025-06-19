import type { iconProps } from './iconProps';

function gapX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gap x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.25,2h-1c-1.5166,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h1c.4141,0,.75-.3359.75-.75V2.75c0-.4141-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,2h-1c-.4141,0-.75.3359-.75.75v12.5c0,.4141.3359.75.75.75h1c1.5166,0,2.75-1.2334,2.75-2.75V4.75c0-1.5166-1.2334-2.75-2.75-2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9,12c-.4141,0-.75-.3359-.75-.75v-4.5c0-.4141.3359-.75.75-.75s.75.3359.75.75v4.5c0,.4141-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default gapX;
