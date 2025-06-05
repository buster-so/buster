import type { iconProps } from './iconProps';

function aspectRatioSquare(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px aspect ratio square';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-5,4h-2.25v2.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3c0-.414,.336-.75,.75-.75h3c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm5.25,6.75c0,.414-.336,.75-.75,.75h-3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.25v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default aspectRatioSquare;
