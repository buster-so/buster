import type { iconProps } from './iconProps';

function copies4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px copies 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.25,12.75v1.5c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2v-3.5c0-1.105,.895-2,2-2h1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,9.25v1.5c0,1.105-.895,2-2,2h-3.5c-1.105,0-2-.895-2-2v-3.5c0-1.105,.895-2,2-2h1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7.5"
          width="7.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 12.5 5.5)"
          x="8.75"
          y="1.75"
        />
      </g>
    </svg>
  );
}

export default copies4;
