import type { iconProps } from './iconProps';

function radioChecked(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px radio checked';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm0,11c-1.654,0-3-1.346-3-3s1.346-3,3-3,3,1.346,3,3-1.346,3-3,3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default radioChecked;
