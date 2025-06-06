import type { iconProps } from './iconProps';

function expandObj2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px expand obj 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="4.5"
          width="4.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-180 6 6)"
          x="3.75"
          y="3.75"
        />
        <path
          d="m10.75,4.25v-2.25c0-.414-.336-.75-.75-.75h-2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m4.25,10.75H2c-.414,0-.75-.336-.75-.75v-2.25"
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
