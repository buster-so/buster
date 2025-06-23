import type { iconProps } from './iconProps';

function progressBar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px progress bar';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,8H3.75c-2.068,0-3.75,1.682-3.75,3.75s1.682,3.75,3.75,3.75H14.25c2.068,0,3.75-1.682,3.75-3.75s-1.682-3.75-3.75-3.75Zm-5.25,4.5H3.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,6c-.413,0-.798-.201-1.029-.537l-1.757-2.554c-.258-.375-.285-.858-.069-1.259s.637-.651,1.099-.651h3.512c.461,0,.882,.249,1.099,.651s.189,.884-.069,1.259l-1.756,2.553s0,0,0,0c-.231,.336-.616,.537-1.029,.537Zm.412-.949h0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default progressBar;
