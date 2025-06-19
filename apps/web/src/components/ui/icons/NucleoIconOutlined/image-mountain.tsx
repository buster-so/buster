import type { iconProps } from './iconProps';

function imageMountain(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px image mountain';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.329,12.658l-4.273-5.812c-.4-.543-1.212-.543-1.611,0l-3.319,4.514-1.444-1.964c-.4-.544-1.212-.544-1.611,0l-2.398,3.262c-.486,.66-.014,1.592,.806,1.592H15.523c.82,0,1.291-.932,.806-1.592Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="5.5"
          cy="4"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default imageMountain;
