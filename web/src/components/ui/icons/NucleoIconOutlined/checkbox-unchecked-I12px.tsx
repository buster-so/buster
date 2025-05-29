import type { iconProps } from './iconProps';

function checkboxUnchecked(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px checkbox unchecked';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="9.5"
          width="9.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.25"
          y="1.25"
        />
      </g>
    </svg>
  );
}

export default checkboxUnchecked;
