import type { iconProps } from './iconProps';

function findEdit(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px find edit';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="10"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.09 12.09L15.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.25,16.25V6.6644c0-.2653-.1054-.5198-.293-.7074l-3.9143-3.9143c-.1874-.1874-.4417-.2927-.7067-.2927h-5.586c-1.1046,0-2,.8954-2,2v10.5c0,1.1046.8954,2,2,2h6.5"
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

export default findEdit;
