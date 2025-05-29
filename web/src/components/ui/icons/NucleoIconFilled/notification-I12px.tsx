import type { iconProps } from './iconProps';

function notification(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px notification';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,16.5H4.25c-1.517,0-2.75-1.233-2.75-2.75V5.25c0-1.517,1.233-2.75,2.75-2.75h5.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H4.25c-.689,0-1.25,.561-1.25,1.25V13.75c0,.689,.561,1.25,1.25,1.25H12.75c.689,0,1.25-.561,1.25-1.25v-5.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v5.25c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <circle cx="14.5" cy="3.5" fill="currentColor" r="2.5" />
      </g>
    </svg>
  );
}

export default notification;
