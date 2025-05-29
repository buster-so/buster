import type { iconProps } from './iconProps';

function openInBrowser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px open in browser';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.25,0H2.75C1.233,0,0,1.233,0,2.75v3.5c0,1.517,1.233,2.75,2.75,2.75h2.5v-3.189l-.97.97c-.293.293-.768.293-1.061,0s-.293-.768,0-1.061l2.25-2.25c.293-.293.768-.293,1.061,0l2.25,2.25c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22s-.384-.073-.53-.22l-.97-.97v3.189h2.5c1.517,0,2.75-1.233,2.75-2.75v-3.5c0-1.517-1.233-2.75-2.75-2.75ZM2.75,3.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5.25,9v2.25c0,.414.336.75.75.75s.75-.336.75-.75v-2.25h-1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default openInBrowser;
