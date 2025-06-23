import type { iconProps } from './iconProps';

function doubleChevronDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px double chevron down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,11c-.192,0-.384-.073-.53-.22L1.47,6.78c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.47,3.47,3.47-3.47c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-4,4c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,6.5c-.192,0-.384-.073-.53-.22L1.47,2.28c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.47,3.47,3.47-3.47c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-4,4c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default doubleChevronDown;
