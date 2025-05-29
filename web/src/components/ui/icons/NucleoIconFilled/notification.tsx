import type { iconProps } from './iconProps';

function notification(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px notification';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.75,11.501H3.25c-1.517,0-2.75-1.233-2.75-2.75V3.251C.5,1.735,1.733.501,3.25.501h3.551c.414,0,.75.336.75.75s-.336.75-.75.75h-3.551c-.689,0-1.25.561-1.25,1.25v5.5c0,.689.561,1.25,1.25,1.25h5.5c.689,0,1.25-.561,1.25-1.25v-3.551c0-.414.336-.75.75-.75s.75.336.75.75v3.551c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="10.25" cy="1.751" fill="currentColor" r="1.75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default notification;
