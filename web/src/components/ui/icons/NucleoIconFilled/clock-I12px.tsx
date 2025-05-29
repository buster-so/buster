import type { iconProps } from './iconProps';

function clock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm3.867,10.677c-.146,.21-.379,.323-.617,.323-.147,0-.296-.043-.426-.133l-3.25-2.25c-.203-.14-.323-.371-.323-.617V4.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.857l2.927,2.026c.341,.236,.426,.703,.19,1.043Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default clock;
