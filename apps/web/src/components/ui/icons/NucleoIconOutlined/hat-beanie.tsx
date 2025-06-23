import type { iconProps } from './iconProps';

function hatBeanie(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hat beanie';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.572,4.973c.264-.339,.428-.76,.428-1.223,0-1.104-.895-2-2-2s-2,.896-2,2c0,.463,.164,.884,.428,1.223"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25,12.75v-2.25c0-3.176,2.574-5.75,5.75-5.75h0c3.176,0,5.75,2.574,5.75,5.75v2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 12.75L9 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 12.75L5.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 12.75L12.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3.5"
          width="14.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="12.75"
        />
      </g>
    </svg>
  );
}

export default hatBeanie;
