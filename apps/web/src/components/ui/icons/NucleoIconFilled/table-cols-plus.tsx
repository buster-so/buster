import type { iconProps } from './iconProps';

function tableColsPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table cols plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25,2h-3.5c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h3.5V2Z"
          fill="currentColor"
        />
        <path
          d="M11.75,12h.25v-.25c0-1.241,1.009-2.25,2.25-2.25,.71,0,1.337,.337,1.75,.853V4.75c0-1.517-1.233-2.75-2.75-2.75h-3.5V13.241c.371-.732,1.124-1.241,2-1.241Z"
          fill="currentColor"
        />
        <path
          d="M16.75,13.5h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableColsPlus;
