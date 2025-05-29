import type { iconProps } from './iconProps';

function replaceObjs(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px replace objs';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="3.25" cy="14.75" fill="currentColor" r="2.25" />
        <circle cx="14.75" cy="3.25" fill="currentColor" r="2.25" />
        <path
          d="M5.22,7.228l-1.22,1.22v-3.197c0-.689,.561-1.25,1.25-1.25h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H5.25c-1.517,0-2.75,1.233-2.75,2.75v3.182l-1.204-1.204c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.492,2.492c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.492-2.492c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M17.765,9.712l-2.492-2.492c-.293-.293-.768-.293-1.061,0l-2.492,2.492c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l1.22-1.22v3.197c0,.689-.561,1.25-1.25,1.25H7.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c1.517,0,2.75-1.233,2.75-2.75v-3.182l1.204,1.204c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default replaceObjs;
