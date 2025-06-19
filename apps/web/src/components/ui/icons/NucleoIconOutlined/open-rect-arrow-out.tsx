import type { iconProps } from './iconProps';

function openRectArrowOut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px open rect arrow out';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.75,2.75h3.5c1.105,0,2,.895,2,2V13.25c0,1.105-.895,2-2,2h-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25 5.5L2.75 9 6.25 12.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 9L10.25 9"
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

export default openRectArrowOut;
