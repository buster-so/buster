import type { iconProps } from './iconProps';

function addBelow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px add below';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11,2H1c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h10c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11,5H1c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h10c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.25,8.25h-1.5v-1.5c0-.4141-.3359-.75-.75-.75s-.75.3359-.75.75v1.5h-1.5c-.4141,0-.75.3359-.75.75s.3359.75.75.75h1.5v1.5c0,.4141.3359.75.75.75s.75-.3359.75-.75v-1.5h1.5c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11,2H1c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h10c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11,5H1c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h10c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default addBelow;
