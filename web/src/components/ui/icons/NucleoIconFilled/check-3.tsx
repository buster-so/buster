import type { iconProps } from './iconProps';

function check3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px check 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4.21,10.329h-.011c-.289-.004-.549-.174-.67-.436-.622-1.35-1.334-2.387-2.31-3.363-.293-.293-.293-.768,0-1.061.293-.293.768-.293,1.061,0,.772.773,1.398,1.577,1.943,2.508,1.4-2.384,3.272-4.451,5.58-6.16.333-.246.802-.177,1.049.157.246.333.176.803-.157,1.049-2.516,1.861-4.471,4.179-5.814,6.888-.126.256-.387.417-.672.417Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default check3;
