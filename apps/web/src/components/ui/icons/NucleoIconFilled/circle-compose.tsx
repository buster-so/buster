import type { iconProps } from './iconProps';

function circleCompose(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle compose';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.765,6.279c-.398,.114-.629,.529-.515,.927,.166,.581,.25,1.185,.25,1.794,0,3.584-2.916,6.5-6.5,6.5s-6.5-2.916-6.5-6.5S5.416,2.5,9,2.5c.609,0,1.213,.084,1.794,.25,.395,.113,.813-.117,.927-.515,.114-.398-.116-.813-.515-.928-.715-.205-1.457-.308-2.206-.308C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8c0-.749-.104-1.491-.309-2.206-.113-.398-.532-.627-.927-.515Z"
          fill="currentColor"
        />
        <path
          d="M7.22,10.78c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22L16.53,2.53c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0L7.22,9.72c-.293,.293-.293,.768,0,1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleCompose;
