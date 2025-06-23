import type { iconProps } from './iconProps';

function duplicate2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px duplicate 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="11"
          width="11"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-180 7.25 7.25)"
          x="1.75"
          y="1.75"
        />
        <path
          d="M15.199,6.002l1.029,6.924c.162,1.093-.592,2.11-1.684,2.272l-6.924,1.029c-.933,.139-1.81-.39-2.148-1.228"
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

export default duplicate2;
