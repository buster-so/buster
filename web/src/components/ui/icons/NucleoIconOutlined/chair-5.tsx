import type { iconProps } from './iconProps';

function chair5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chair 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 12.75L9 17.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 15L5.75 16.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 15L12.25 16.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,10.25c-.5-2.938-.429-5.577-.429-5.577-.04-.521-.475-.923-.997-.923h-2.324s-2.324,0-2.324,0c-.523,0-.957,.402-.997,.923,0,0,.071,2.639-.429,5.577"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 6.75L2.75 8.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 6.75L15.25 8.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.5,10.25H13.5c.414,0,.75,.336,.75,.75v.622c0,.363-.256,.679-.615,.739-1.317,.223-2.879,.389-4.635,.389-1.307,0-2.875-.092-4.624-.387-.36-.061-.626-.379-.626-.744v-.619c0-.414,.336-.75,.75-.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="5.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="6.25"
          y=".75"
        />
      </g>
    </svg>
  );
}

export default chair5;
