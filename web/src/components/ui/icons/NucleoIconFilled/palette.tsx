import type { iconProps } from './iconProps';

function palette(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px palette';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M3 7H15V11H3z" fill="currentColor" opacity=".4" />
        <path
          d="M13.25,16H4.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75H13.25c1.517,0,2.75,1.233,2.75,2.75V13.25c0,1.517-1.233,2.75-2.75,2.75ZM4.75,3.5c-.689,0-1.25,.561-1.25,1.25V13.25c0,.689,.561,1.25,1.25,1.25H13.25c.689,0,1.25-.561,1.25-1.25V4.75c0-.689-.561-1.25-1.25-1.25H4.75Z"
          fill="currentColor"
        />
        <path d="M3,11H15v2c0,1.104-.896,2-2,2H5c-1.104,0-2-.896-2-2v-2h0Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default palette;
