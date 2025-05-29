import type { iconProps } from './iconProps';

function inputPasswordEdit(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px input password edit';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.5" cy="9" fill="currentColor" r="1" />
        <circle cx="9" cy="9" fill="currentColor" r="1" />
        <circle cx="12.5" cy="9" fill="currentColor" r="1" />
        <path
          d="M9.141,12.5H3.75c-.689,0-1.25-.561-1.25-1.25V6.75c0-.689,.561-1.25,1.25-1.25H14.25c.689,0,1.25,.561,1.25,1.25v.524c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.524c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v4.5c0,1.517,1.233,2.75,2.75,2.75h5.391c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.963,9.433l-3.689,3.691c-.164,.162-.293,.356-.383,.578,0,0,0,.001,0,.002l-.63,1.561c-.112,.277-.049,.595,.162,.808,.144,.145,.337,.223,.533,.223,.092,0,.184-.017,.272-.051l1.514-.59c.226-.088,.427-.219,.603-.393l3.723-3.724c.281-.281,.436-.655,.434-1.051-.002-.394-.157-.765-.439-1.048-.563-.562-1.536-.565-2.098-.004Zm-3.378,4.552h0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default inputPasswordEdit;
