import type { iconProps } from './iconProps';

function arrowDoorOut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow door out';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.75,1.5H7.25c-.965,0-1.75,.785-1.75,1.75v2.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.25c0-.138,.112-.25,.25-.25h5.302l-1.724,1.069c-.518,.321-.828,.877-.828,1.487v6.887c0,.61,.31,1.166,.828,1.487l1.724,1.069H7.25c-.138,0-.25-.112-.25-.25v-2.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.5c0,.965,.785,1.75,1.75,1.75h6.5c.965,0,1.75-.785,1.75-1.75V3.25c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M2.561,9.75H6.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2.561l1.47-1.47c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0L.22,8.47c-.293,.293-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.47-1.47Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowDoorOut;
