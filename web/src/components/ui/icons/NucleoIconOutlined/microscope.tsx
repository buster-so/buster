import type { iconProps } from './iconProps';

function microscope(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px microscope';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.797 6.684L10.789 7.995"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.494,4.928l-1.703,1.289c-1.541,1.167-1.845,3.362-.678,4.903l.571,.754"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.217 12.197L14.435 9.004"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,15.25H2.75v-.75c0-1.519,1.231-2.75,2.75-2.75s2.75,1.231,2.75,2.75v.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="5.5"
          width="3.146"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-37.128 8.137 4.492)"
          x="6.563"
          y="1.741"
        />
      </g>
    </svg>
  );
}

export default microscope;
