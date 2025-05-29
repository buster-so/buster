import type { iconProps } from './iconProps';

function goalFlag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px goal flag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,17.75c-.414,0-.75-.336-.75-.75v-1.25c0-.965,.785-1.75,1.75-1.75h4.25v-1.25c0-.965,.785-1.75,1.75-1.75h4.25v-3H6.75c-.31,0-.587-.19-.699-.478-.112-.289-.035-.616,.192-.825l2.396-2.197-2.396-2.197c-.228-.209-.305-.536-.192-.825,.112-.288,.39-.478,.699-.478h7c.965,0,1.75,.785,1.75,1.75V11.75c0,.414-.336,.75-.75,.75h-5c-.138,0-.25,.112-.25,.25v2c0,.414-.336,.75-.75,.75H3.75c-.138,0-.25,.112-.25,.25v1.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default goalFlag;
