import type { iconProps } from './iconProps';

function arrowsOppositeDirectionX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrows opposite direction x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.28,5.22c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l1.22,1.22h-4.189c-.414,0-.75.336-.75.75s.336.75.75.75h4.189l-1.22,1.22c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l2.5-2.5c.293-.293.293-.768,0-1.061l-2.5-2.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.75,3H2.561l1.22-1.22c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0L.22,3.22c-.293.293-.293.768,0,1.061l2.5,2.5c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061l-1.22-1.22h4.189c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowsOppositeDirectionX;
