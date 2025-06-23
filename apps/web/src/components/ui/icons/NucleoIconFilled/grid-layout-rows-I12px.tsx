import type { iconProps } from './iconProps';

function gridLayoutRows(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid layout rows';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="6"
          width="14"
          fill="currentColor"
          rx="2.25"
          ry="2.25"
          strokeWidth="0"
          x="2"
          y="10"
        />
        <rect
          height="6"
          width="14"
          fill="currentColor"
          rx="2.25"
          ry="2.25"
          strokeWidth="0"
          x="2"
          y="2"
        />
      </g>
    </svg>
  );
}

export default gridLayoutRows;
