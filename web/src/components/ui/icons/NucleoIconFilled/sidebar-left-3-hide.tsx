import type { iconProps } from './iconProps';

function sidebarLeft3Hide(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sidebar left 3 hide';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm1.25,11.25c0,.689-.561,1.25-1.25,1.25H7v-1.568l-2.341-2.341c-.425-.425-.659-.99-.659-1.591s.234-1.166,.659-1.591l2.341-2.341v-1.568h7.25c.689,0,1.25,.561,1.25,1.25V13.25Z"
          fill="currentColor"
        />
        <path
          d="M12.75,8.25h-4.689l1.22-1.22c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.22-1.22h4.689c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sidebarLeft3Hide;
