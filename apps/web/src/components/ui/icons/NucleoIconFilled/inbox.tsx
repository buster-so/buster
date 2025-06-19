import type { iconProps } from './iconProps';

function inbox(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px inbox';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.978,6.068l-.871-3.485c-.307-1.227-1.404-2.083-2.668-2.083H3.562C2.297.5,1.2,1.356.894,2.583L.022,6.068c-.015.059-.022.12-.022.182v2.5c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75v-2.5c0-.062-.007-.123-.022-.182ZM3.562,2h4.877c.575,0,1.073.39,1.213.947l.763,3.053h-1.664c-.414,0-.75.336-.75.75v1.25h-4v-1.25c0-.414-.336-.75-.75-.75h-1.664l.763-3.053c.14-.558.638-.947,1.213-.947Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default inbox;
