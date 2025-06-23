import type { iconProps } from './iconProps';

function border(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px border';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,2H2.75c-.414,0-.75,.336-.75,.75V15.25c0,.414,.336,.75,.75,.75H15.25c.414,0,.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Zm-.75,12.5H3.5V3.5H14.5V14.5Z"
          fill="currentColor"
        />
        <circle cx="5.875" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="9" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="9" cy="5.875" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default border;
