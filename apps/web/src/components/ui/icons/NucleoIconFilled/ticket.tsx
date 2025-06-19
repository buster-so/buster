import type { iconProps } from './iconProps';

function ticket(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ticket';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,7.5c.414,0,.75-.336,.75-.75v-1c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v1c0,.414,.336,.75,.75,.75,.827,0,1.5,.673,1.5,1.5s-.673,1.5-1.5,1.5c-.414,0-.75,.336-.75,.75v1c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-1c0-.414-.336-.75-.75-.75-.827,0-1.5-.673-1.5-1.5s.673-1.5,1.5-1.5Zm-4.25,2.75c0,.414-.336,.75-.75,.75H6.75c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75v2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default ticket;
