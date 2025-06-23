import type { iconProps } from './iconProps';

function followObjLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px follow obj left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12 12.25L8.75 9 12 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 9L16.25 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="12.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 4.25 9)"
          x="-2"
          y="7.5"
        />
      </g>
    </svg>
  );
}

export default followObjLeft;
