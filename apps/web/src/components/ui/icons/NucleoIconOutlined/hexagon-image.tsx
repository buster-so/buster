import type { iconProps } from './iconProps';

function hexagonImage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hexagon image';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.687,14.064l5.149-5.15c.781-.781,2.047-.781,2.828,0l2.301,2.301"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.527,15.25h4.946c.713,0,1.372-.38,1.73-.997l2.465-4.25c.36-.621,.36-1.386,0-2.007l-2.465-4.25c-.358-.617-1.017-.997-1.73-.997H6.527c-.713,0-1.372,.38-1.73,.997L2.332,7.997c-.36,.621-.36,1.386,0,2.007l2.465,4.25c.358,.617,1.017,.997,1.73,.997Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6.75" cy="7.25" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default hexagonImage;
