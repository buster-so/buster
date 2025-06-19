import type { iconProps } from './iconProps';

function gapY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gap y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m16,15.25v-1c0-1.5166-1.2334-2.75-2.75-2.75H4.75c-1.5166,0-2.75,1.2334-2.75,2.75v1c0,.4141.3359.75.75.75h12.5c.4141,0,.75-.3359.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m16,3.75v-1c0-.4141-.3359-.75-.75-.75H2.75c-.4141,0-.75.3359-.75.75v1c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,9c0-.4141.3359-.75.75-.75h4.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75h-4.5c-.4141,0-.75-.3359-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default gapY;
