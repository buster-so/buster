import type { iconProps } from './iconProps';

function trashContent(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px trash content';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.423,5.249l2.316-2.634c.402-.457,1.115-.452,1.51,.01l2.247,2.624"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.442 2.757L13.577 5.249"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.577,5.249l-.477,9.106c-.056,1.062-.934,1.895-1.997,1.895h-2.102s-2.102,0-2.102,0c-1.064,0-1.941-.833-1.997-1.895l-.477-9.106H13.577Z"
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

export default trashContent;
