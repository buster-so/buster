import type { iconProps } from './iconProps';

function hospital(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hospital';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m16.25,10h-1.25v1.5h1.25c.1377,0,.25.1123.25.25v3.5c0,.1377-.1123.25-.25.25h-2.25v1.5h2.25c.9648,0,1.75-.7852,1.75-1.75v-3.5c0-.9648-.7852-1.75-1.75-1.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4,15.5H1.75c-.1377,0-.25-.1123-.25-.25v-3.5c0-.1377.1123-.25.25-.25h1.25v-1.5h-1.25c-.9648,0-1.75.7852-1.75,1.75v3.5c0,.9648.7852,1.75,1.75,1.75h2.25v-1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m13.25,1H4.75c-.9648,0-1.75.7852-1.75,1.75v13.5c0,.4141.3359.75.75.75h3.25v-3.75c0-.4141.3359-.75.75-.75h2.5c.4141,0,.75.3359.75.75v3.75h3.25c.4141,0,.75-.3359.75-.75V2.75c0-.9648-.7852-1.75-1.75-1.75Zm-2,6.5h-1.5v1.5c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-1.5h-1.5c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h1.5v-1.5c0-.4141.3359-.75.75-.75s.75.3359.75.75v1.5h1.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default hospital;
