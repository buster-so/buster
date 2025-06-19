import type { iconProps } from './iconProps';

function scaleFromTopRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scale from top right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2.75h-4.25V7.25c0,.965,.785,1.75,1.75,1.75h4.5V4.75c0-1.105-.896-2-2-2Z"
          fill="currentColor"
        />
        <path
          d="M13.25,16H4.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75H13.25c1.517,0,2.75,1.233,2.75,2.75V13.25c0,1.517-1.233,2.75-2.75,2.75ZM4.75,3.5c-.689,0-1.25,.561-1.25,1.25V13.25c0,.689,.561,1.25,1.25,1.25H13.25c.689,0,1.25-.561,1.25-1.25V4.75c0-.689-.561-1.25-1.25-1.25H4.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default scaleFromTopRight;
