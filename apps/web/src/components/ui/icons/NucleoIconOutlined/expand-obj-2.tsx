import type { iconProps } from './iconProps';

function expandObj2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px expand obj 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="6.5"
          width="6.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-180 9 9)"
          x="5.75"
          y="5.75"
        />
        <path
          d="M15.75,6.25V3.25c0-.552-.448-1-1-1h-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,15.75H3.25c-.552,0-1-.448-1-1v-3"
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

export default expandObj2;
