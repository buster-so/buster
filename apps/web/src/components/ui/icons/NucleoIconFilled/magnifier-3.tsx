import type { iconProps } from './iconProps';

function magnifier3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px magnifier 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,16c-.192,0-.384-.073-.53-.22l-3.965-3.965c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.965,3.965c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M7.75,2c-3.171,0-5.75,2.58-5.75,5.75s2.579,5.75,5.75,5.75,5.75-2.58,5.75-5.75S10.921,2,7.75,2Zm2.5,6.5c-.414,0-.75-.336-.75-.75,0-.965-.785-1.75-1.75-1.75-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c1.792,0,3.25,1.458,3.25,3.25,0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default magnifier3;
