import type { iconProps } from './iconProps';

function lineDashed(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px line dashed';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4.75,9.75h-2c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h2c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10,9.75h-2c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h2c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,9.75h-2c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h2c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default lineDashed;
