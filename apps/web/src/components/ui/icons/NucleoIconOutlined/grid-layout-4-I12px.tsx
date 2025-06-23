import type { iconProps } from './iconProps';

function gridLayout4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px grid layout 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="3.5"
          width="3.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.25"
          y="1.25"
        />
        <rect
          height="9.5"
          width="3.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.25"
          y="1.25"
        />
        <rect
          height="3.5"
          width="3.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.25"
          y="7.25"
        />
      </g>
    </svg>
  );
}

export default gridLayout4;
