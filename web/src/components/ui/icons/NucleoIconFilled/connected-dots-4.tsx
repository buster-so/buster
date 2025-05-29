import type { iconProps } from './iconProps';

function connectedDots4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px connected dots 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.664,8.336c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.922-2.922c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.922,2.922c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M13.336,8.336c-.192,0-.384-.073-.53-.22l-2.922-2.922c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.922,2.922c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M10.414,14.086c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.922-2.922c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.922,2.922c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M7.586,14.086c-.192,0-.384-.073-.53-.22l-2.922-2.922c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.922,2.922c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <circle cx="9" cy="3.25" fill="currentColor" r="2.75" />
        <circle cx="9" cy="14.75" fill="currentColor" r="2.75" />
        <circle cx="14.75" cy="9" fill="currentColor" r="2.75" />
        <circle cx="3.25" cy="9" fill="currentColor" r="2.75" />
      </g>
    </svg>
  );
}

export default connectedDots4;
