import type { iconProps } from './iconProps';

function reuse(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px reuse';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7 13.25L5 15.25 7 17.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11 4.75L13 2.75 11 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25,15.25H13.25c1.105,0,2-.896,2-2V4.75c0-.243-.05-.472-.129-.688"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,2.75H4.75c-1.105,0-2,.896-2,2V13.25c0,.243,.05,.472,.129,.688"
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

export default reuse;
