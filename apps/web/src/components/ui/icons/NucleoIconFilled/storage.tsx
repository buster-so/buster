import type { iconProps } from './iconProps';

function storage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px storage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <ellipse cx="6" cy="2.75" fill="currentColor" rx="5" ry="2.75" strokeWidth="0" />
        <path
          d="m6,12c-2.851,0-5-1.182-5-2.75,0-.414.336-.75.75-.75s.75.336.75.75c0,.441,1.329,1.25,3.5,1.25s3.5-.809,3.5-1.25c0-.414.336-.75.75-.75s.75.336.75.75c0,1.568-2.149,2.75-5,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,8.75c-2.851,0-5-1.182-5-2.75,0-.414.336-.75.75-.75s.75.336.75.75c0,.441,1.329,1.25,3.5,1.25s3.5-.809,3.5-1.25c0-.414.336-.75.75-.75s.75.336.75.75c0,1.568-2.149,2.75-5,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default storage;
