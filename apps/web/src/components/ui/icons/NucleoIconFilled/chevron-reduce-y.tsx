import type { iconProps } from './iconProps';

function chevronReduceY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chevron reduce y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.75,11.5c-.192,0-.384-.073-.53-.22l-2.22-2.22-2.22,2.22c-.293.293-.768.293-1.061,0s-.293-.768,0-1.061l2.75-2.75c.293-.293.768-.293,1.061,0l2.75,2.75c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,4.75c-.192,0-.384-.073-.53-.22L2.72,1.78c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.22,2.22,2.22-2.22c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-2.75,2.75c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chevronReduceY;
