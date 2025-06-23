import type { iconProps } from './iconProps';

function circleKey(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1c-2.211,0-4.268,.882-5.793,2.483-.286,.3-.274,.774,.026,1.06,.299,.286,.774,.275,1.06-.026,1.239-1.301,2.911-2.017,4.707-2.017,3.584,0,6.5,2.916,6.5,6.5s-2.916,6.5-6.5,6.5c-1.796,0-3.468-.716-4.707-2.017-.286-.3-.761-.311-1.06-.026-.3,.286-.312,.76-.026,1.06,1.525,1.601,3.582,2.483,5.793,2.483,4.411,0,8-3.589,8-8S13.411,1,9,1Z"
          fill="currentColor"
        />
        <path
          d="M6.383,9.75h2.117v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.25h.75v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.25h.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H6.383c-.329-1.151-1.378-2-2.633-2-1.517,0-2.75,1.233-2.75,2.75s1.233,2.75,2.75,2.75c1.255,0,2.304-.849,2.633-2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleKey;
