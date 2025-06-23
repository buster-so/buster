import type { iconProps } from './iconProps';

function laptopChartLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px laptop chart line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.75,7.5l-2.146,2.146c-.195,.195-.512,.195-.707,0l-1.793-1.793c-.195-.195-.512-.195-.707,0l-2.146,2.146"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25,14.75c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2H13.75c1.105,0,2,.895,2,2V12.75c0,1.105-.895,2-2,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 14.75L17.25 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default laptopChartLine;
