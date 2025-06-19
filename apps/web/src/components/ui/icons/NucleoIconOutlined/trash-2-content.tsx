import type { iconProps } from './iconProps';

function trash2Content(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px trash 2 content';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m4.423,5.249l2.316-2.634c.402-.457,1.115-.452,1.51.01l2.247,2.624"
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
          d="m13.577,5.249l-.477,9.106c-.056,1.062-.934,1.895-1.997,1.895h-2.102s-2.102,0-2.102,0c-1.064,0-1.941-.833-1.997-1.895l-.477-9.106h9.153Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.375 8.25L7.625 13.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.625 8.25L10.375 13.25"
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

export default trash2Content;
