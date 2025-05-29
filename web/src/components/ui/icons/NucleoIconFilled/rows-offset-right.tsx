import type { iconProps } from './iconProps';

function rowsOffsetRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rows offset right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.28,5.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.97,1.97-1.97,1.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061l-2.5-2.5Z"
          fill="currentColor"
        />
        <rect height="4" width="10.5" fill="currentColor" rx="1.75" ry="1.75" x="1" y="7" />
        <rect height="4" width="10.5" fill="currentColor" rx="1.75" ry="1.75" x="1" y="1.5" />
        <rect height="4" width="10.5" fill="currentColor" rx="1.75" ry="1.75" x="1" y="12.5" />
      </g>
    </svg>
  );
}

export default rowsOffsetRight;
