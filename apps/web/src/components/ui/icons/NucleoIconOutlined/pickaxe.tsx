import type { iconProps } from './iconProps';

function pickaxe(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pickaxe';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.681,3.569c-2.934-1.889-6.067-1.509-6.469-1.453,1.62,1.219,3.053,2.44,4.312,3.611"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.431,6.319c1.889,2.934,1.509,6.067,1.453,6.469-1.219-1.62-2.44-3.053-3.611-4.312"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.432,8.568l-6.768,6.768c-.552,.552-1.448,.552-2,0h0c-.552-.552-.552-1.448,0-2l6.768-6.768"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3.889"
          width="4.596"
          fill="none"
          rx=".5"
          ry=".5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-45 12.058 5.942)"
          x="9.76"
          y="3.998"
        />
      </g>
    </svg>
  );
}

export default pickaxe;
