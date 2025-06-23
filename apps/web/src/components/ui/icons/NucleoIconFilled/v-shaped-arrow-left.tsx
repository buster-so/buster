import type { iconProps } from './iconProps';

function vShapedArrowLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px v shaped arrow left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.922,2.13c-.344-.234-.81-.144-1.042,.198l-4.25,6.25c-.173,.255-.173,.589,0,.844l4.25,6.25c.146,.213,.381,.328,.621,.328,.145,0,.292-.042,.421-.13,.343-.233,.432-.699,.198-1.042l-3.963-5.828,3.963-5.828c.233-.343,.145-.809-.198-1.042Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default vShapedArrowLeft;
