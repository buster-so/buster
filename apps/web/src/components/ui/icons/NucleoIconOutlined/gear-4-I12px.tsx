import type { iconProps } from './iconProps';

function gear4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px gear 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="6"
          cy="6"
          fill="none"
          r="4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.942 2.112L6.375 0.75 5.625 0.75 5.058 2.112"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.917 2.584L2.553 2.023 2.023 2.553 2.584 3.917"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.112 5.058L0.75 5.625 0.75 6.375 2.112 6.942"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.584 8.083L2.023 9.447 2.553 9.977 3.917 9.416"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.058 9.888L5.625 11.25 6.375 11.25 6.942 9.888"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.083 9.416L9.447 9.977 9.977 9.447 9.416 8.083"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.888 6.942L11.25 6.375 11.25 5.625 9.888 5.058"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.416 3.917L9.977 2.553 9.447 2.023 8.083 2.584"
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

export default gear4;
