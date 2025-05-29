import type { iconProps } from './iconProps';

function belt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px belt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25,11.25H1.75c-.552,0-1-.448-1-1v-2.5c0-.552,.448-1,1-1H6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,6.75h4.5c.552,0,1,.448,1,1v2.5c0,.552-.448,1-1,1h-4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75 9L11.75 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7.5"
          width="5.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="6.25"
          y="5.25"
        />
      </g>
    </svg>
  );
}

export default belt;
