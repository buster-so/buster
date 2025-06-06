import type { iconProps } from './iconProps';

function code(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px code';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.5,14.5c-.192,0-.384-.073-.53-.22L1.22,9.53c-.293-.293-.293-.768,0-1.061L5.97,3.72c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.811,9l4.22,4.22c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M11.5,14.5c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l4.22-4.22-4.22-4.22c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l4.75,4.75c.293,.293,.293,.768,0,1.061l-4.75,4.75c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default code;
