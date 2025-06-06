import type { iconProps } from './iconProps';

function followObjDownRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px follow obj down right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.75,2.49c-.414,0-.75,.336-.75,.75v2.7L3.28,2.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3.72,3.72H3.24c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H7.75c.414,0,.75-.336,.75-.75V3.24c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="7" width="7" fill="currentColor" rx="1.75" ry="1.75" x="9" y="9" />
      </g>
    </svg>
  );
}

export default followObjDownRight;
