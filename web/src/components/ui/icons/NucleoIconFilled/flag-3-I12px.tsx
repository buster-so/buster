import type { iconProps } from './iconProps';

function flag3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flag 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.738,6.75l2.582-3.012c.191-.223,.234-.536,.112-.802-.122-.266-.388-.437-.681-.437H4V11H14.75c.293,0,.559-.17,.681-.437,.123-.266,.079-.579-.112-.802l-2.582-3.012Z"
          fill="currentColor"
        />
        <path
          d="M3.75,17c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v14.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default flag3;
