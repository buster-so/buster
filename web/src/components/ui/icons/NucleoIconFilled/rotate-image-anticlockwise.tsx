import type { iconProps } from './iconProps';

function rotateImageAnticlockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rotate image anticlockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.25,7H3.75c-1.517,0-2.75,1.233-2.75,2.75v4.5c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75v-4.5c0-1.517-1.233-2.75-2.75-2.75ZM2.5,14.25v-4.5c0-.689,.561-1.25,1.25-1.25h6.5c.689,0,1.25,.561,1.25,1.25v3.025l-1.263-1.263c-.661-.661-1.813-.661-2.475,0l-3.987,3.987h-.025c-.689,0-1.25-.561-1.25-1.25Z"
          fill="currentColor"
        />
        <path
          d="M12.75,2.5h-1.027l.776-.689c.31-.275,.338-.749,.062-1.059-.275-.31-.75-.339-1.059-.062l-2.25,2c-.16,.142-.252,.346-.252,.561s.092,.418,.252,.561l2.25,2c.143,.127,.32,.189,.498,.189,.207,0,.413-.085,.561-.252,.275-.31,.247-.783-.062-1.059l-.776-.689h1.027c1.792,0,3.25,1.458,3.25,3.25v1c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1c0-2.619-2.131-4.75-4.75-4.75Z"
          fill="currentColor"
        />
        <circle cx="5" cy="11" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default rotateImageAnticlockwise;
