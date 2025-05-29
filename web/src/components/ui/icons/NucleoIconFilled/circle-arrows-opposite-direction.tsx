import type { iconProps } from './iconProps';

function circleArrowsOppositeDirection(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle arrows opposite direction';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1c-.513,0-1.013,.053-1.5,.146V10.689l.72-.72c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2,2c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-2-2c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l.72,.72V1.589C3.072,2.779,1,5.65,1,9c0,4.411,3.589,8,8,8,.513,0,1.013-.053,1.5-.146V7.311l-.72,.72c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061l2-2c.293-.293,.768-.293,1.061,0l2,2c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-.72-.72v9.101c2.928-1.19,5-4.061,5-7.411,0-4.411-3.589-8-8-8Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleArrowsOppositeDirection;
