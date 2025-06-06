import type { iconProps } from './iconProps';

function photo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px photo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4,14.75l5.836-5.836c.781-.781,2.047-.781,2.828,0l3.586,3.586"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
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
          transform="rotate(180 9 9)"
          x="1.75"
          y="3.25"
        />
        <circle cx="5.75" cy="7.25" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default photo;
