import type { iconProps } from './iconProps';

function windowBottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window bottom';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="11.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="3.25"
        />
        <path
          d="M4.75 9.75H13.25V11.75H4.75z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default windowBottom;
