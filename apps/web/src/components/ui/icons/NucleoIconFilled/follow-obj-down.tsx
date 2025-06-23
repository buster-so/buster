import type { iconProps } from './iconProps';

function followObjDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px follow obj down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m7.97,2.72l-1.22,1.22V.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v3.189l-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l2.5,2.5c.146.146.338.22.53.22s.384-.073.53-.22l2.5-2.5c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="4.5"
          width="4.5"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          y="7.5"
        />
      </g>
    </svg>
  );
}

export default followObjDown;
