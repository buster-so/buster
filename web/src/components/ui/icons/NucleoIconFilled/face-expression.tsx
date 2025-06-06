import type { iconProps } from './iconProps';

function faceExpression(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face expression';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,7.5c-.414,0-.75-.336-.75-.75v-2c0-1.517,1.233-2.75,2.75-2.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-2c-.689,0-1.25,.561-1.25,1.25v2c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,7.5c-.414,0-.75-.336-.75-.75v-2c0-.689-.561-1.25-1.25-1.25h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c1.517,0,2.75,1.233,2.75,2.75v2c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,16h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.689,0,1.25-.561,1.25-1.25v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M6.75,16h-2c-1.517,0-2.75-1.233-2.75-2.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2c0,.689,.561,1.25,1.25,1.25h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.897,9.757c-.154-.154-.366-.221-.583-.189h0c-1.532,.239-3.112,.238-4.638-.001-.214-.032-.421,.035-.572,.185-.154,.153-.227,.376-.193,.598,.23,1.511,1.558,2.651,3.089,2.651s2.86-1.141,3.089-2.654c.033-.216-.039-.436-.192-.589h0Z"
          fill="currentColor"
        />
        <circle cx="6" cy="7" fill="currentColor" r="1" />
        <circle cx="12" cy="7" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default faceExpression;
