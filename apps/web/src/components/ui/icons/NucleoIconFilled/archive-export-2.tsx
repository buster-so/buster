import type { iconProps } from './iconProps';

function archiveExport2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px archive export 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m16.25,1h-3.5c-.4141,0-.75.3359-.75.75s.3359.75.75.75h1.6895l-3.2197,3.2197c-.293.293-.293.7676,0,1.0605.1465.1465.3384.2197.5303.2197s.3838-.0732.5303-.2197l3.2197-3.2197v1.6895c0,.4141.3359.75.75.75s.75-.3359.75-.75V1.75c0-.4141-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,6.7861c-.4141,0-.75.3359-.75.75v1.9639h-2.75c-.4141,0-.75.3359-.75.75v1.5c0,.1377-.1123.25-.25.25h-3.5c-.1377,0-.25-.1123-.25-.25v-1.5c0-.4141-.3359-.75-.75-.75h-2.75v-4.75c0-.6895.5605-1.25,1.25-1.25h5.7134c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75h-5.7134c-1.5161,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75v-5.7139c0-.4141-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default archiveExport2;
