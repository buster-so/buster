import type { iconProps } from './iconProps';

function imageMountain(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px image mountain';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.5" cy="4" fill="currentColor" r="2" />
        <path
          d="M12.66,6.401c-.666-.906-2.154-.906-2.82,0l-2.715,3.692-.84-1.142c-.666-.907-2.154-.907-2.82,0l-2.398,3.262c-.393,.535-.451,1.234-.151,1.827s.898,.96,1.562,.96H15.523c.663,0,1.262-.368,1.562-.96s.241-1.292-.151-1.827l-4.273-5.812Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default imageMountain;
