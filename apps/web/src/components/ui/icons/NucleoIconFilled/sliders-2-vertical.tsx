import type { iconProps } from './iconProps';

function sliders2Vertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sliders 2 vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,14.5c-.414,0-.75,.336-.75,.75v1c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15,4.377V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.627c-1.011,.321-1.75,1.257-1.75,2.373,0,1.378,1.121,2.5,2.5,2.5s2.5-1.122,2.5-2.5c0-1.115-.739-2.052-1.75-2.373Z"
          fill="currentColor"
        />
        <path
          d="M14.25,10.5c-.414,0-.75,.336-.75,.75v5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M4.5,4.377V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.627c-1.011,.321-1.75,1.257-1.75,2.373,0,1.378,1.121,2.5,2.5,2.5s2.5-1.122,2.5-2.5c0-1.115-.739-2.052-1.75-2.373Z"
          fill="currentColor"
        />
        <path
          d="M3.75,10.5c-.414,0-.75,.336-.75,.75v5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M9.75,8.627V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6.877c-1.011,.321-1.75,1.257-1.75,2.373,0,1.378,1.121,2.5,2.5,2.5s2.5-1.122,2.5-2.5c0-1.115-.739-2.052-1.75-2.373Zm-.75,3.373c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sliders2Vertical;
