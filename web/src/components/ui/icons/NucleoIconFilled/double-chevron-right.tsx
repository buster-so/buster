import type { iconProps } from './iconProps';

function doubleChevronRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px double chevron right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6.25,10.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l3.47-3.47-3.47-3.47c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l4,4c.293.293.293.768,0,1.061l-4,4c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.75,10.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l3.47-3.47L1.22,2.53c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l4,4c.293.293.293.768,0,1.061l-4,4c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default doubleChevronRight;
