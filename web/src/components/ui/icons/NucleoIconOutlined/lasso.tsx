import type { iconProps } from './iconProps';

function lasso(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lasso';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,13.75c-2.059,0-2.212-1.591-1.961-2.197,.314-.759,1.204-1.448,3.18-1.272,2.826,.252,4.464,4.406-.469,6.469"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="9"
          cy="8"
          fill="none"
          rx="6.75"
          ry="5.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default lasso;
