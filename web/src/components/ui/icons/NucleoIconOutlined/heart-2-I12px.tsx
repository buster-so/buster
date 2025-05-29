import type { iconProps } from './iconProps';

function heart2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px heart 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.49,6.417l-3.968,4.123c-.285.296-.759.296-1.043,0L1.51,6.417c-1.051-1.106-1.006-2.856.101-3.907,1.106-1.051,2.856-1.006,3.907.101.196.206.358.441.482.697.778-1.602,2.898-2.114,4.35-.841.387.34.673.797.804,1.296.263,1.001-.025,1.983-.663,2.655Z"
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

export default heart2;
