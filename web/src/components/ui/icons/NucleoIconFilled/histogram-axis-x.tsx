import type { iconProps } from './iconProps';

function histogramAxisX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px histogram axis x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,11.5c-2.964,0-3.921-2.323-4.69-4.189-.718-1.743-1.226-2.811-2.56-2.811s-1.842,1.068-2.56,2.811c-.769,1.866-1.726,4.189-4.69,4.189-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c1.828,0,2.467-1.231,3.303-3.26,.722-1.753,1.541-3.74,3.947-3.74s3.225,1.987,3.947,3.74c.835,2.029,1.475,3.26,3.303,3.26,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,15H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h14.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default histogramAxisX;
