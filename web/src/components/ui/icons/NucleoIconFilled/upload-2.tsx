import type { iconProps } from './iconProps';

function upload2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px upload 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.25,11H2.75c-1.517,0-2.75-1.233-2.75-2.75V3.75C0,2.233,1.233,1,2.75,1c.414,0,.75.336.75.75s-.336.75-.75.75c-.689,0-1.25.561-1.25,1.25v4.5c0,.689.561,1.25,1.25,1.25h6.5c.689,0,1.25-.561,1.25-1.25V3.75c0-.689-.561-1.25-1.25-1.25-.414,0-.75-.336-.75-.75s.336-.75.75-.75c1.517,0,2.75,1.233,2.75,2.75v4.5c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.78,3.47l-2.25-2.25c-.293-.293-.768-.293-1.061,0l-2.25,2.25c-.293.293-.293.768,0,1.061s.768.293,1.061,0l.97-.97v4.189c0,.414.336.75.75.75s.75-.336.75-.75V3.561l.97.97c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default upload2;
