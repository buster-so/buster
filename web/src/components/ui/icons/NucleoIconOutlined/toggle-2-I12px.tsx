import type { iconProps } from './iconProps';

function toggle2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px toggle 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="7.5"
          width="10.5"
          fill="none"
          rx="3.75"
          ry="3.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y="2.25"
        />
        <circle cx="4.5" cy="6" fill="currentColor" r="2" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default toggle2;
