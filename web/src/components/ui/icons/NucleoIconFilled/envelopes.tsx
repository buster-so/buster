import type { iconProps } from './iconProps';

function envelopes(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelopes';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,16H5.75c-2.619,0-4.75-2.131-4.75-4.75v-3.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.5c0,1.792,1.458,3.25,3.25,3.25h6.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.117,8.283c.08,.051,.186,.051,.266,0l6.397-3.987c-.36-.763-1.132-1.296-2.03-1.296H5.75c-.895,0-1.663,.529-2.025,1.288l6.392,3.995Z"
          fill="currentColor"
        />
        <path
          d="M11.177,9.556c-.281,.176-.604,.264-.927,.264s-.646-.088-.928-.264L3.5,5.916v5.334c0,1.241,1.01,2.25,2.25,2.25H14.75c1.24,0,2.25-1.009,2.25-2.25V5.927l-5.823,3.629Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default envelopes;
