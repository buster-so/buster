import type { iconProps } from './iconProps';

function folderContent2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder content 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.75,8.5c-.414,0-.75-.336-.75-.75v-3c0-.689-.561-1.25-1.25-1.25H5.966c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7.784c1.516,0,2.75,1.233,2.75,2.75v3c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,5h-4.238l-1.301-1.838c-.515-.728-1.354-1.162-2.245-1.162h-1.716c-1.517,0-2.75,1.233-2.75,2.75V12.75c0,1.517,1.233,2.75,2.75,2.75H13.75c1.517,0,2.75-1.233,2.75-2.75V7.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default folderContent2;
