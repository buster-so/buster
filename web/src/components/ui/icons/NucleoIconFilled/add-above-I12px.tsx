import type { iconProps } from './iconProps';

function addAbove(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px add above';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m12,6h-2.25v2.25c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-2.25h-2.25c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h2.25v-2.25c0-.4141.3359-.75.75-.75s.75.3359.75.75v2.25h2.25c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,10.5H2.75c-.4141,0-.75.3359-.75.75s.3359.75.75.75h12.5c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,14H2.75c-.4141,0-.75.3359-.75.75s.3359.75.75.75h12.5c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default addAbove;
