import type { iconProps } from './iconProps';

function squarePlus2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square plus 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m14.75,8c-1.2402,0-2.25-1.0093-2.25-2.25v-.25h-.25c-1.2402,0-2.25-1.0093-2.25-2.25,0-.4624.1408-.8921.381-1.25h-5.631c-1.5166,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75v-5.6309c-.3578.24-.7877.3809-1.25.3809Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m17.25,2.5h-1.75V.75c0-.4141-.3359-.75-.75-.75s-.75.3359-.75.75v1.75h-1.75c-.4141,0-.75.3359-.75.75s.3359.75.75.75h1.75v1.75c0,.4141.3359.75.75.75s.75-.3359.75-.75v-1.75h1.75c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default squarePlus2;
