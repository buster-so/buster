import type { iconProps } from './iconProps';

function investment2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px investment 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2.52h-1.25c-1.354,0-2.569,.576-3.435,1.487C9.014,1.993,7.187,.5,5,.5h-1.25c-.409,0-.743,.328-.75,.737-.03,1.787,.87,3.438,2.349,4.309,1.057,.623,2.132,.684,2.901,.611v4.593c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.599c.157,.013,.322,.024,.504,.024,.711,0,1.585-.13,2.397-.609,1.479-.871,2.379-2.522,2.349-4.309-.007-.409-.341-.737-.75-.737Z"
          fill="currentColor"
        />
        <path
          d="M13,11.75c0-.965-.785-1.75-1.75-1.75H6.75c-.965,0-1.75,.785-1.75,1.75v1c0,.372,.119,.716,.318,1-.199,.284-.318,.628-.318,1v1c0,.965,.785,1.75,1.75,1.75h4.5c.965,0,1.75-.785,1.75-1.75v-1c0-.372-.119-.716-.318-1,.199-.284,.318-.628,.318-1v-1Zm-6.5,0c0-.138,.112-.25,.25-.25h4.5c.138,0,.25,.112,.25,.25v1c0,.138-.112,.25-.25,.25H6.75c-.138,0-.25-.112-.25-.25v-1Z"
          fill="currentColor"
        />
        <path
          d="M3.5,16.5h-.75c-.965,0-1.75-.785-1.75-1.75v-1c0-.965,.785-1.75,1.75-1.75h.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-.75c-.138,0-.25,.112-.25,.25v1c0,.138,.112,.25,.25,.25h.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,16.5h-.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.75c.138,0,.25-.112,.25-.25v-1c0-.138-.112-.25-.25-.25h-.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.75c.965,0,1.75,.785,1.75,1.75v1c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default investment2;
