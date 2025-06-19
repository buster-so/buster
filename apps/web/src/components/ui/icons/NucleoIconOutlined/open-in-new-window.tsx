import type { iconProps } from './iconProps';

function openInNewWindow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px open in new window';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.75,3.75v10.5c0,1.105.895,2,2,2h10.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m4.75,5.25v-1.5c0-1.1046.8954-2,2-2h7.5c1.1046,0,2,.8954,2,2v7.5c0,1.1046-.8954,2-2,2h-7.5c-1.1046,0-2-.8954-2-2h0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 5.75L11.25 8.25 8.75 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11 8.25L4.75 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m14.25,1.75h-7.5c-1.1046,0-2,.8954-2,2v.25h11.5v-.25c0-1.1046-.8954-2-2-2Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default openInNewWindow;
