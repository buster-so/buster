import type { iconProps } from './iconProps';

function userFocus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user focus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="6.5" fill="currentColor" r="2.75" />
        <path
          d="M4.728,12.921c-.113,.232-.099,.507,.039,.726,.137,.219,.377,.353,.636,.353h7.195c.259,0,.499-.133,.636-.353,.137-.219,.152-.494,.039-.726-.803-1.648-2.44-2.671-4.272-2.671s-3.469,1.023-4.272,2.671Z"
          fill="currentColor"
        />
        <path
          d="M15.75,11c-.414,0-.75,.336-.75,.75v2c0,.689-.561,1.25-1.25,1.25h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c1.517,0,2.75-1.233,2.75-2.75v-2c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M6.25,15h-2c-.689,0-1.25-.561-1.25-1.25v-2c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2c0,1.517,1.233,2.75,2.75,2.75h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M2.25,7c.414,0,.75-.336,.75-.75v-2c0-.689,.561-1.25,1.25-1.25h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2c-1.517,0-2.75,1.233-2.75,2.75v2c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,1.5h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c.689,0,1.25,.561,1.25,1.25v2c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userFocus;
