import type { iconProps } from './iconProps';

function squareChevronRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square chevron right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-1.72,7.53l-3,3c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l2.47-2.47-2.47-2.47c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3,3c.293,.293,.293,.768,0,1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareChevronRight;
