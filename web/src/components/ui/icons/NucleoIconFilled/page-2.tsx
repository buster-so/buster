import type { iconProps } from './iconProps';

function page2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px page 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.25,0H3.75C2.233,0,1,1.233,1,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h4.5c1.517,0,2.75-1.233,2.75-2.75V2.75c0-1.517-1.233-2.75-2.75-2.75Zm-2.25,7h-1.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h1.75c.414,0,.75.336.75.75s-.336.75-.75.75Zm1.75-2.5h-3.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h3.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default page2;
