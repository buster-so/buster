import type { iconProps } from './iconProps';

function circlePowerOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle power off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-.75,3.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V4.25Zm.75,9.75c-2.757,0-5-2.243-5-5,0-1.579,.769-3.084,2.057-4.027,.333-.245,.804-.171,1.048,.163s.172,.804-.163,1.048c-.917,.671-1.443,1.697-1.443,2.816,0,1.93,1.57,3.5,3.5,3.5s3.5-1.57,3.5-3.5c0-1.119-.526-2.146-1.443-2.816-.334-.245-.407-.714-.163-1.048,.244-.334,.714-.408,1.048-.163,1.288,.943,2.057,2.448,2.057,4.027,0,2.757-2.243,5-5,5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circlePowerOff;
