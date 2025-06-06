import type { iconProps } from './iconProps';

function imageMountain2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px image mountain 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5,6.25c.966,0,1.75-.784,1.75-1.75s-.784-1.75-1.75-1.75-1.75,.784-1.75,1.75,.784,1.75,1.75,1.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.726,6.65L3.117,13.466c-.743,.588-.327,1.784,.621,1.784H14.499c.676,0,1.157-.657,.954-1.301l-2.152-6.815c-.211-.668-1.025-.918-1.574-.483Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default imageMountain2;
