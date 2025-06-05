import type { iconProps } from './iconProps';

function textTitleCase(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text title case';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.068 12.25L5.498 3.75 5.32 3.75 1.75 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.59 10.25L8.228 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,6.75v6.303c0,1.214-.984,2.197-2.197,2.197h0c-.728,0-1.373-.354-1.773-.899"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="5"
          width="4.395"
          fill="none"
          rx="2.095"
          ry="2.095"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.355"
          y="6.75"
        />
      </g>
    </svg>
  );
}

export default textTitleCase;
