import type { iconProps } from './iconProps';

function views(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px views';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="10.5"
          width="13.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.25"
          y="2.75"
        />
        <path
          d="M4.75 16.25L13.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.691,7.108c-.54-.694-1.736-1.858-3.691-1.858s-3.151,1.164-3.691,1.859c-.413,.533-.413,1.249,0,1.782,0,0,0,0,0,0,.54,.694,1.736,1.858,3.691,1.858s3.151-1.164,3.691-1.859c.413-.533,.413-1.249,0-1.783Zm-3.691,2.392c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5,.672,1.5,1.5-.672,1.5-1.5,1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default views;
