import type { iconProps } from './iconProps';

function paintRoller(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paint roller';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M.75,4v1.242c0,1.66,1.348,3.004,3.008,3l4.239-.011c.553-.001,1.003,.447,1.003,1v1.519"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6"
          width="2.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.75"
          y="10.75"
        />
        <rect
          height="11.5"
          width="4"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 9 3.75)"
          x="7"
          y="-2"
        />
      </g>
    </svg>
  );
}

export default paintRoller;
