import type { iconProps } from './iconProps';

function vShapedArrowUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px v shaped arrow up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.422,5.63c-.255-.173-.589-.173-.844,0L2.328,9.88c-.342,.233-.431,.699-.198,1.042,.233,.344,.7,.431,1.042,.198l5.828-3.963,5.828,3.963c.129,.088,.276,.13,.421,.13,.24,0,.476-.115,.621-.328,.233-.343,.144-.809-.198-1.042l-6.25-4.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default vShapedArrowUp;
