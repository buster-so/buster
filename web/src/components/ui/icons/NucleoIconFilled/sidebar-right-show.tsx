import type { iconProps } from './iconProps';

function sidebarRightShow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sidebar right show';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.311,9l1.97-1.97c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.97-1.97Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM2.5,13.25V4.75c0-.689,.561-1.25,1.25-1.25h7.25V14.5H3.75c-.689,0-1.25-.561-1.25-1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sidebarRightShow;
