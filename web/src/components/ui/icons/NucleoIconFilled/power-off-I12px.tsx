import type { iconProps } from './iconProps';

function powerOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px power off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,16.5c-4.136,0-7.5-3.364-7.5-7.5,0-2.634,1.35-5.028,3.61-6.404,.352-.215,.814-.103,1.03,.25,.216,.354,.104,.815-.251,1.031-1.81,1.102-2.89,3.017-2.89,5.123,0,3.309,2.691,6,6,6s6-2.691,6-6c0-2.106-1.08-4.021-2.89-5.123-.354-.215-.467-.677-.251-1.031,.216-.354,.678-.466,1.03-.25,2.261,1.376,3.61,3.77,3.61,6.404,0,4.136-3.364,7.5-7.5,7.5Z"
          fill="currentColor"
        />
        <path
          d="M9,9c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default powerOff;
