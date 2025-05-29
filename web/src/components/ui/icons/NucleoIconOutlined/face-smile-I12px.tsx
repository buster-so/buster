import type { iconProps } from './iconProps';

function faceSmile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px face smile';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="6"
          cy="6"
          fill="none"
          r="5.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="4.25" cy="5.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="7.75" cy="5.25" fill="currentColor" r=".75" strokeWidth="0" />
        <path
          d="m8,7.886c-.502.532-1.213.864-2,.864s-1.498-.332-2-.864"
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

export default faceSmile;
