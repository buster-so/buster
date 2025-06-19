import type { iconProps } from './iconProps';

function headphones3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px headphones 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="6.5"
          width="2.5"
          fill="none"
          rx="1.25"
          ry="1.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="4.25"
          y="8.75"
        />
        <rect
          height="6.5"
          width="2.5"
          fill="none"
          rx="1.25"
          ry="1.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-180 12.5 12)"
          x="11.25"
          y="8.75"
        />
        <path
          d="M16.25,12.25V7.75c0-3.314-2.686-6-6-6h-2.5c-3.314,0-6,2.686-6,6v4.5"
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

export default headphones3;
