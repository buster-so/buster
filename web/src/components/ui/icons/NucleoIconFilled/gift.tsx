import type { iconProps } from './iconProps';

function gift(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px gift';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,4.5h-2.833c-1.195,0-2.167-1.009-2.167-2.25S1.972,0,3.167,0c2.653,0,3.525,3.425,3.562,3.571.055.224.004.46-.139.642-.142.181-.359.287-.59.287ZM3.167,1.5c-.368,0-.667.336-.667.75s.299.75.667.75h1.75c-.332-.686-.903-1.5-1.75-1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.833,4.5h-2.833c-.23,0-.448-.106-.59-.287-.143-.182-.193-.418-.139-.642.036-.146.908-3.571,3.562-3.571,1.195,0,2.167,1.009,2.167,2.25s-.972,2.25-2.167,2.25Zm-1.75-1.5h1.75c.368,0,.667-.336.667-.75s-.299-.75-.667-.75c-.847,0-1.418.814-1.75,1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,4.5H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h10.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5.25,6H1v2.75c0,1.517,1.233,2.75,2.75,2.75h1.5v-5.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.75,6v5.5h1.5c1.517,0,2.75-1.233,2.75-2.75v-2.75h-4.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default gift;
