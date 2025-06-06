import type { iconProps } from './iconProps';

function arrowDiagonalIn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow diagonal in';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1.22,2.28L5.439,6.5H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H7.25c.414,0,.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.689S2.28,1.22,2.28,1.22c-.146-.146-.338-.22-.53-.22s-.384,.073-.53,.22c-.293,.293-.293,.768,0,1.061Z"
          fill="currentColor"
        />
        <path
          d="M4.75,16H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75h-3.75s0,5.25,0,5.25c0,1.241-1.01,2.25-2.25,2.25H2s0,3.75,0,3.75c0,1.517,1.233,2.75,2.75,2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowDiagonalIn;
