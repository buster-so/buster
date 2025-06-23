import type { iconProps } from './iconProps';

function award(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px award';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6,7.75c-1.281,0-2.39-.696-3-1.723v5.472c0,.399.445.638.777.416l2.223-1.482,2.223,1.482c.332.221.777-.017.777-.416v-5.472c-.61,1.027-1.719,1.723-3,1.723Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle
          cx="6"
          cy="4.25"
          fill="none"
          r="3.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default award;
