import type { iconProps } from './iconProps';

function filter2Off(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px filter 2 off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.72,1.22c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M7,9.568v1.432L15.78,2.22c-.136-.136-.323-.22-.53-.22H2.75c-.414,0-.75,.336-.75,.75v1.785c0,.518,.227,1.006,.622,1.338l4.378,3.695Z"
          fill="currentColor"
        />
        <path
          d="M7,14.182v2.068c0,.414,.336,.75,.75,.75h2.5c.414,0,.75-.336,.75-.75v-6.068l-4,4Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default filter2Off;
