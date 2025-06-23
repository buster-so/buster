import type { iconProps } from './iconProps';

function arrowsExpand(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrows expand';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75.5h-3.5c-.414,0-.75.336-.75.75s.336.75.75.75h1.689l-1.702,1.702c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l1.702-1.702v1.689c0,.414.336.75.75.75s.75-.336.75-.75V1.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.75,10h-1.689l1.702-1.702c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0l-1.702,1.702v-1.689c0-.414-.336-.75-.75-.75s-.75.336-.75.75v3.5c0,.414.336.75.75.75h3.5c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,6.5c-.414,0-.75.336-.75.75v1.689l-1.702-1.702c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l1.702,1.702h-1.689c-.414,0-.75.336-.75.75s.336.75.75.75h3.5c.414,0,.75-.336.75-.75v-3.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.75.5H1.25c-.414,0-.75.336-.75.75v3.5c0,.414.336.75.75.75s.75-.336.75-.75v-1.689l1.702,1.702c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061l-1.702-1.702h1.689c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowsExpand;
