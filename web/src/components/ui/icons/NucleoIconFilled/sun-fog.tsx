import type { iconProps } from './iconProps';

function sunFog(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sun fog';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12,9.75c0-.414-.336-.75-.75-.75H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H11.25c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,12h-5.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,15H5.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,9h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M6.5,12.75c0-.414-.336-.75-.75-.75H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M3.608,7.5H14.392c.223,0,.434-.099,.577-.271,.143-.171,.201-.397,.161-.616-.547-2.963-3.125-5.114-6.129-5.114S3.418,3.65,2.871,6.614c-.041,.219,.018,.445,.161,.616,.143,.171,.354,.271,.577,.271Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sunFog;
