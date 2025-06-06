import type { iconProps } from './iconProps';

function arrowCornerBottomLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow corner bottom left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,16.75c-.414,0-.75-.336-.75-.75V7.25c0-.689-.561-1.25-1.25-1.25H2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H10.75c1.517,0,2.75,1.233,2.75,2.75v8.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.75,17c-.192,0-.384-.073-.53-.22l-3.5-3.5c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.97,2.97,2.97-2.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-3.5,3.5c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M5.25,9.5c-.192,0-.384-.073-.53-.22L1.22,5.78c-.293-.293-.293-.768,0-1.061L4.72,1.22c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.97,2.97,2.97,2.97c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowCornerBottomLeft;
