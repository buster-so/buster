import type { iconProps } from './iconProps';

function creditCardHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px credit card heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,5.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17v-.75Z"
          fill="currentColor"
        />
        <path
          d="M8.5,12.972c-.007-2.038,1.643-3.71,3.677-3.722,.655,.008,1.278,.181,1.821,.491,.54-.309,1.156-.482,1.796-.491,.425,.002,.826,.091,1.206,.223v-1.473H1v4.25c0,1.517,1.233,2.75,2.75,2.75h5.14c-.24-.614-.39-1.287-.39-2.028Zm-1.75-.972h-2.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.731,17.933c.17,.089,.368,.089,.538,0,.897-.472,3.731-2.181,3.731-4.961,.004-1.221-.974-2.215-2.187-2.222-.73,.009-1.408,.38-1.813,.991-.405-.611-1.084-.981-1.813-.991-1.213,.007-2.191,1.002-2.187,2.222,0,2.78,2.834,4.489,3.731,4.961Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default creditCardHeart;
