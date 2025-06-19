import type { iconProps } from './iconProps';

function circleChevronLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle chevron left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm1.53,10.47c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-3-3c-.293-.293-.293-.768,0-1.061l3-3c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.47,2.47,2.47,2.47Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleChevronLeft;
