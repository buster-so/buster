import type { iconProps } from './iconProps';

function squareDottedArrowTopLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square dotted arrow top left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="15.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="5.875" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="2.75" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="5.875" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="15.25" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="2.75" fill="currentColor" r=".75" />
        <path
          d="M2,8.75c0,.414,.336,.75,.75,.75h6c.414,0,.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V6.939L3.28,2.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l4.72,4.72H2.75c-.414,0-.75,.336-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareDottedArrowTopLeft;
