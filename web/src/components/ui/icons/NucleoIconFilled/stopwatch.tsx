import type { iconProps } from './iconProps';

function stopwatch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stopwatch';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.75,3.042v-1.042h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H6.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5v1.042c-3.508,.376-6.25,3.352-6.25,6.958,0,3.86,3.14,7,7,7s7-3.14,7-7c0-3.606-2.742-6.583-6.25-6.958Zm-.22,7.489c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-2.298-2.298c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.298,2.298c.293,.293,.293,.768,0,1.061Z"
          fill="currentColor"
        />
        <path
          d="M16.25,5.5c-.192,0-.384-.073-.53-.22l-2-2c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2,2c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default stopwatch;
