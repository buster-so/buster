import type { iconProps } from './iconProps';

function textBold(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text bold';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.653,8.471c.82-.733,1.347-1.787,1.347-2.971,0-2.206-1.794-4-4-4h-3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.75c1.379,0,2.5,1.122,2.5,2.5s-1.121,2.5-2.5,2.5h-3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.5c1.517,0,2.75,1.233,2.75,2.75s-1.233,2.75-2.75,2.75H6.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.5c2.344,0,4.25-1.907,4.25-4.25,0-1.656-.961-3.078-2.347-3.779Z"
          fill="currentColor"
        />
        <path
          d="M6,1.5h-1.25c-.966,0-1.75,.784-1.75,1.75V14.75c0,.966,.784,1.75,1.75,1.75h1.25V1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default textBold;
