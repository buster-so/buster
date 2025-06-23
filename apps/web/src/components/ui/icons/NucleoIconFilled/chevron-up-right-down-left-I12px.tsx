import type { iconProps } from './iconProps';

function chevronUpRightDownLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chevron up right down left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.25,5.25c-.192,0-.384-.073-.53-.22l-1.72-1.72-1.72,1.72c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061l2.25-2.25c.293-.293,.768-.293,1.061,0l2.25,2.25c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M9,16.5c-.192,0-.384-.073-.53-.22l-2.25-2.25c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.72,1.72,1.72-1.72c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.25,2.25c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M4.5,12c-.192,0-.384-.073-.53-.22l-2.25-2.25c-.293-.293-.293-.768,0-1.061l2.25-2.25c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-1.72,1.72,1.72,1.72c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M13.5,12c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l1.72-1.72-1.72-1.72c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.25,2.25c.293,.293,.293,.768,0,1.061l-2.25,2.25c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chevronUpRightDownLeft;
