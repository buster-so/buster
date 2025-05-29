import type { iconProps } from './iconProps';

function chatBubbleLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,13.75c0-1.129,.597-2.149,1.507-2.732,.12-1.96,1.753-3.518,3.743-3.518,.848,0,1.621,.295,2.25,.771v-3.521c0-1.517-1.233-2.75-2.75-2.75H4.25c-1.517,0-2.75,1.233-2.75,2.75v11.5c0,.288,.165,.551,.425,.676,.103,.05,.214,.074,.325,.074,.167,0,.333-.056,.469-.165l3.544-2.835h2.737v-.25Z"
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

export default chatBubbleLock;
