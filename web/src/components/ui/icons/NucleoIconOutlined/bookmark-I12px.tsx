import type { iconProps } from './iconProps';

function bookmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px bookmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.25,11.25l-4.25-3.25-4.25,3.25V2.75C1.75,1.645,2.645.75,3.75.75h4.5c1.105,0,2,.895,2,2v8.5Z"
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

export default bookmark;
