import type { iconProps } from './iconProps';

function copies5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px copies 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m7.75,14h-1c-1.5166,0-2.75-1.2334-2.75-2.75v-4.5c0-1.5166,1.2334-2.75,2.75-2.75h4.5c1.5166,0,2.75,1.2334,2.75,2.75v1c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-1c0-.6895-.5605-1.25-1.25-1.25h-4.5c-.6895,0-1.25.5605-1.25,1.25v4.5c0,.6895.5605,1.25,1.25,1.25h1c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.75,11h-1c-1.5166,0-2.75-1.2334-2.75-2.75V3.75c0-1.5166,1.2334-2.75,2.75-2.75h4.5c1.5166,0,2.75,1.2334,2.75,2.75v1c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-1c0-.6895-.5605-1.25-1.25-1.25H3.75c-.6895,0-1.25.5605-1.25,1.25v4.5c0,.6895.5605,1.25,1.25,1.25h1c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="10"
          width="10"
          fill="currentColor"
          rx="2.75"
          ry="2.75"
          strokeWidth="0"
          x="7"
          y="7"
        />
      </g>
    </svg>
  );
}

export default copies5;
