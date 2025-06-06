import type { iconProps } from './iconProps';

function newspaper2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px newspaper 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m16.25,2.5H4.75c-.4141,0-.75.3359-.75.75v10c0,.4136-.3364.75-.75.75s-.75-.3364-.75-.75v-7.25c0-.4141-.3359-.75-.75-.75s-.75.3359-.75.75v7.25c0,1.2407,1.0093,2.25,2.25,2.25h11.5c1.2407,0,2.25-1.0093,2.25-2.25V3.25c0-.4141-.3359-.75-.75-.75Zm-3,8.5h-5.5c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h5.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Zm0-3h-5.5c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h5.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default newspaper2;
