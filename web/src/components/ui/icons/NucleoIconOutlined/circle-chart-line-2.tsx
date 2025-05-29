import type { iconProps } from './iconProps';

function circleChartLine2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle chart line 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.769,6.399l-4.332,4.331c-.195,.195-.512,.195-.707,0l-3.46-3.46c-.195-.195-.512-.195-.707,0L2.23,11.599"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.235,9.469c-.241,3.786-3.388,6.781-7.235,6.781-4.004,0-7.25-3.246-7.25-7.25S4.996,1.75,9,1.75c3.088,0,5.724,1.93,6.77,4.649"
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

export default circleChartLine2;
