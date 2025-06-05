import type { iconProps } from './iconProps';

function bookOpen3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px book open 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,2h-4.25c-.787,0-1.498,.333-2,.864-.502-.532-1.213-.864-2-.864H2.75c-.965,0-1.75,.785-1.75,1.75V13.25c0,.965,.785,1.75,1.75,1.75H7c.689,0,1.25,.561,1.25,1.25,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-.689,.561-1.25,1.25-1.25h4.25c.965,0,1.75-.785,1.75-1.75V3.75c0-.965-.785-1.75-1.75-1.75Zm.25,11.25c0,.138-.112,.25-.25,.25h-4.25c-.452,0-.873,.12-1.25,.314V4.75c0-.689,.561-1.25,1.25-1.25h4.25c.138,0,.25,.112,.25,.25V13.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bookOpen3;
