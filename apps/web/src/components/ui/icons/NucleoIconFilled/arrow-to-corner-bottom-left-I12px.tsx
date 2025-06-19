import type { iconProps } from './iconProps';

function arrowToCornerBottomLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow to corner bottom left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.72,2.22l-6.22,6.22v-3.7c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v5.51c0,.414,.336,.75,.75,.75h5.51c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-3.7L15.78,3.28c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M14.25,14.5H4.75c-.689,0-1.25-.561-1.25-1.25V3.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowToCornerBottomLeft;
