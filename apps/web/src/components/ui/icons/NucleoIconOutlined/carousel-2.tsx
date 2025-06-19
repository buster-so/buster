import type { iconProps } from './iconProps';

function carousel2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px carousel 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3,13.5l-1.053,.451c-.33,.141-.697-.101-.697-.46V4.508c0-.359,.367-.601,.697-.46l1.053,.451"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15,13.5l1.053,.451c.33,.141,.697-.101,.697-.46V4.508c0-.359-.367-.601-.697-.46l-1.053,.451"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="12.5"
          width="7.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 9 9)"
          x="5.25"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default carousel2;
