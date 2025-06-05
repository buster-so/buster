import type { iconProps } from './iconProps';

function key2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px key 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.311,2.75l1.47-1.47c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0l-5.733,5.733c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l3.203-3.203,1.47,1.47c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061l-1.47-1.47Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="3.5" cy="8.5" fill="currentColor" r="3.5" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default key2;
