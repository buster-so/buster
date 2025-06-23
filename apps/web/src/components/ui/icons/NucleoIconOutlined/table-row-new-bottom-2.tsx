import type { iconProps } from './iconProps';

function tableRowNewBottom2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table row new bottom 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 11.25L9 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5 13.75L6.5 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="4.5"
          width="14.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="3.75"
        />
      </g>
    </svg>
  );
}

export default tableRowNewBottom2;
