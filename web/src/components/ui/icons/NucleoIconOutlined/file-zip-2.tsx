import type { iconProps } from './iconProps';

function fileZip2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px file zip 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,14.25V3.75c0-1.105,.895-2,2-2h5.586c.265,0,.52,.105,.707,.293l3.914,3.914c.188,.188,.293,.442,.293,.707v7.586c0,1.105-.895,2-2,2H4.75c-1.105,0-2-.895-2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.16,6.25h-3.41c-.552,0-1-.448-1-1V1.852"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M5 9.5H7V11H5z" fill="currentColor" />
        <path d="M7 11H9V12.5H7z" fill="currentColor" />
        <path d="M5 12.5H7V14H5z" fill="currentColor" />
        <path d="M7 14H9V15.5H7z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default fileZip2;
