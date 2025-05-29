import type { iconProps } from './iconProps';

function folder(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.75,9.844c-.414,0-.75-.336-.75-.75v-2.844c0-.689-.561-1.25-1.25-1.25h-5.386c-.228,0-.443-.104-.585-.281l-.603-.752c-.238-.297-.594-.467-.975-.467h-1.951c-.689,0-1.25,.561-1.25,1.25v4c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V4.75c0-1.516,1.233-2.75,2.75-2.75h1.951c.838,0,1.62,.375,2.145,1.029l.378,.471h5.026c1.517,0,2.75,1.234,2.75,2.75v2.844c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <rect height="10" width="15" fill="currentColor" rx="2.75" ry="2.75" x="1.5" y="6" />
      </g>
    </svg>
  );
}

export default folder;
