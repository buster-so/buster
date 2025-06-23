import type { iconProps } from './iconProps';

function caretLeftToLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret left to line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,2.5c-.414,0-.75,.336-.75,.75V14.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.093,2.785c-.559-.308-1.24-.287-1.779,.056L5.93,7.522c-.509,.323-.812,.875-.812,1.478s.304,1.155,.812,1.478h0l7.383,4.682c.285,.181,.61,.272,.937,.272,.29,0,.58-.072,.843-.216,.56-.308,.907-.896,.907-1.534V4.318c0-.638-.348-1.226-.907-1.534Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default caretLeftToLine;
