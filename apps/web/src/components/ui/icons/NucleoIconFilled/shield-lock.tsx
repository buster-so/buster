import type { iconProps } from './iconProps';

function shieldLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shield lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,15.25v-1.5c0-1.129,.597-2.149,1.507-2.732,.12-1.96,1.753-3.518,3.743-3.518,.635,0,1.225,.172,1.75,.452v-3.472c0-.764-.489-1.434-1.217-1.667l-5.25-1.68c-.349-.112-.718-.111-1.066,0L3.216,2.813c-.728,.233-1.216,.903-1.216,1.667v6.52c0,3.508,4.946,5.379,6.46,5.869,.177,.057,.358,.086,.54,.086,.154,0,.306-.031,.456-.072-.283-.482-.456-1.035-.456-1.632Z"
          fill="currentColor"
        />
        <path
          d="M16.5,12.025v-.775c0-1.241-1.009-2.25-2.25-2.25s-2.25,1.009-2.25,2.25v.775c-.846,.123-1.5,.845-1.5,1.725v1.5c0,.965,.785,1.75,1.75,1.75h4c.965,0,1.75-.785,1.75-1.75v-1.5c0-.879-.654-1.602-1.5-1.725Zm-2.25-1.525c.414,0,.75,.336,.75,.75v.75h-1.5v-.75c0-.414,.336-.75,.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shieldLock;
