import type { iconProps } from './iconProps';

function message(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px message';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.25.501H2.75C1.233.501,0,1.735,0,3.251v3.5c0,1.517,1.233,2.75,2.75,2.75h.25v1.75c0,.291.168.556.432.679.102.047.21.071.318.071.172,0,.343-.059.48-.174l2.792-2.326h2.229c1.517,0,2.75-1.233,2.75-2.75v-3.5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default message;
