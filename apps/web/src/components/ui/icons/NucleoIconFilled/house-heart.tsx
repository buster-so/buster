import type { iconProps } from './iconProps';

function houseHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.5,12.972c-.007-2.038,1.643-3.71,3.677-3.722,.655,.008,1.278,.181,1.821,.491,.54-.309,1.156-.482,1.796-.491,.07,0,.136,.018,.206,.022v-2.276c0-.543-.258-1.064-.691-1.394L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75h5.38c-.895-1.021-1.63-2.362-1.63-4.028Z"
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

export default houseHeart;
