import type { iconProps } from './iconProps';

function chartStepChart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,11.75h3v-3h3v-3h3v-3h2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,2.75V12.75c0,1.105,.895,2,2,2H15.25"
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

export default chartStepChart;
