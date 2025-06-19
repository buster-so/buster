import type { iconProps } from './iconProps';

function repeat3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px repeat 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.78,2.22L9.78.22c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l.72.72H3.25c-1.517,0-2.75,1.233-2.75,2.75v.5c0,.414.336.75.75.75s.75-.336.75-.75v-.5c0-.689.561-1.25,1.25-1.25h6.189l-.72.72c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l2-2c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,6c-.414,0-.75.336-.75.75v.5c0,.689-.561,1.25-1.25,1.25H2.561l.72-.72c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0L.22,8.72c-.293.293-.293.768,0,1.061l2,2c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061l-.72-.72h6.189c1.517,0,2.75-1.233,2.75-2.75v-.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default repeat3;
