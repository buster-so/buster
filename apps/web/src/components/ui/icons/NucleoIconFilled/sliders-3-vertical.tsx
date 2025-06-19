import type { iconProps } from './iconProps';

function sliders3Vertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sliders 3 vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,14c-.414,0-.75,.336-.75,.75v1c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M11,11h-1.25V2.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V11h-1.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,8.5c-.414,0-.75,.336-.75,.75v6.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-6.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,5.5h-1.25V2.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.25h-1.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M4.25,8.5c-.414,0-.75,.336-.75,.75v6.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-6.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M7,6.25c0-.414-.336-.75-.75-.75h-1.25V2.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.25h-1.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H6.25c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sliders3Vertical;
