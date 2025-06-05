import type { iconProps } from './iconProps';

function connect(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px connect';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m13,16c-1.6543,0-3-1.3457-3-3s1.3457-3,3-3,3,1.3457,3,3-1.3457,3-3,3Zm0-4.5c-.8271,0-1.5.6729-1.5,1.5s.6729,1.5,1.5,1.5,1.5-.6729,1.5-1.5-.6729-1.5-1.5-1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5,8c-1.6543,0-3-1.3457-3-3s1.3457-3,3-3,3,1.3457,3,3-1.3457,3-3,3Zm0-4.5c-.8271,0-1.5.6729-1.5,1.5s.6729,1.5,1.5,1.5,1.5-.6729,1.5-1.5-.6729-1.5-1.5-1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m13,2c-1.6543,0-3,1.3457-3,3,0,.5547.1616,1.0679.4249,1.5142l-3.9106,3.9109c-.4462-.2634-.9597-.425-1.5143-.425-1.6543,0-3,1.3457-3,3s1.3457,3,3,3,3-1.3457,3-3c0-.5547-.1616-1.0681-.425-1.5144l3.9104-3.9109c.4463.2637.9598.4253,1.5146.4253,1.6543,0,3-1.3457,3-3s-1.3457-3-3-3Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default connect;
