import type { iconProps } from './iconProps';

function animationFrames(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px animation frames';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="8" width="6" fill="currentColor" rx="1.75" ry="1.75" x="6" y="5" />
        <path
          d="M2.75,5H1.75V13h1c.965,0,1.75-.785,1.75-1.75V6.75c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,11.5V5h-1c-.965,0-1.75,.785-1.75,1.75v4.5c0,.965,.785,1.75,1.75,1.75h1v-1.5Z"
          fill="currentColor"
        />
        <path
          d="M14.25,16H3.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75H14.25c1.517,0,2.75,1.233,2.75,2.75V13.25c0,1.517-1.233,2.75-2.75,2.75ZM3.75,3.5c-.689,0-1.25,.561-1.25,1.25V13.25c0,.689,.561,1.25,1.25,1.25H14.25c.689,0,1.25-.561,1.25-1.25V4.75c0-.689-.561-1.25-1.25-1.25H3.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default animationFrames;
