import type { iconProps } from './iconProps';

function timer(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px timer';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1c-.414,0-.75,.336-.75,.75v2.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.707c3.232,.373,5.75,3.126,5.75,6.457,0,3.584-2.916,6.5-6.5,6.5s-6.5-2.916-6.5-6.5c0-.609,.084-1.213,.25-1.794,.114-.398-.117-.813-.515-.927-.398-.111-.813,.117-.927,.515-.205,.715-.308,1.458-.308,2.206,0,4.411,3.589,8,8,8s8-3.589,8-8S13.411,1,9,1Z"
          fill="currentColor"
        />
        <path
          d="M7.357,8.418c-.065,.183-.107,.377-.107,.582,0,.965,.785,1.75,1.75,1.75s1.75-.785,1.75-1.75-.785-1.75-1.75-1.75c-.205,0-.399,.042-.582,.107L4.414,3.353c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l4.004,4.004Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default timer;
