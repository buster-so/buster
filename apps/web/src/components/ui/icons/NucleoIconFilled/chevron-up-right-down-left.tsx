import type { iconProps } from './iconProps';

function chevronUpRightDownLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chevron up right down left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m2.5,8.5c-.192,0-.384-.073-.53-.22L.22,6.53c-.293-.293-.293-.768,0-1.061l1.75-1.75c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-1.22,1.22,1.22,1.22c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.5,8.5c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l1.22-1.22-1.22-1.22c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.75,1.75c.293.293.293.768,0,1.061l-1.75,1.75c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,12c-.192,0-.384-.073-.53-.22l-1.75-1.75c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.22,1.22,1.22-1.22c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-1.75,1.75c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.75,3.25c-.192,0-.384-.073-.53-.22l-1.22-1.22-1.22,1.22c-.293.293-.768.293-1.061,0s-.293-.768,0-1.061L5.47.22c.293-.293.768-.293,1.061,0l1.75,1.75c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chevronUpRightDownLeft;
