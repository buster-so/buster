import type { iconProps } from './iconProps';

function circleArrowIn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle arrow in';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1c-2.69,0-5.185,1.34-6.672,3.585-.229,.345-.135,.811,.21,1.04,.347,.229,.812,.136,1.04-.21,1.209-1.825,3.236-2.914,5.422-2.914,3.584,0,6.5,2.916,6.5,6.5s-2.916,6.5-6.5,6.5c-2.186,0-4.213-1.089-5.422-2.914-.229-.346-.695-.439-1.04-.21-.345,.229-.439,.694-.21,1.04,1.488,2.245,3.982,3.585,6.672,3.585,4.411,0,8-3.589,8-8S13.411,1,9,1Z"
          fill="currentColor"
        />
        <path
          d="M7.47,11.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.25-3.25c.293-.293,.293-.768,0-1.061l-3.25-3.25c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.97,1.97H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h7.689l-1.97,1.97Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleArrowIn;
