import type { iconProps } from './iconProps';

function bucket(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px bucket';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.25,2.5l.861,7.35c0,.773,1.741,1.4,3.889,1.4s3.889-.627,3.889-1.4l.861-7.35"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="6"
          cy="2.5"
          fill="none"
          rx="4.75"
          ry="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default bucket;
