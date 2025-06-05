import type { iconProps } from './iconProps';

function wallet2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px wallet 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.25,6.25c-.414,0-.75-.336-.75-.75C1.5,3.395,3.006,1.61,5.081,1.256L11.643,.136c.771-.13,1.513,.249,1.86,.942l.054,.108c.185,.371,.033,.821-.338,1.005-.372,.186-.82,.033-1.006-.337l-.053-.106c-.048-.098-.149-.153-.266-.133l-6.562,1.12c-1.352,.231-2.333,1.394-2.333,2.766,0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11,9.5c0-1.654,1.346-3,3-3h2.5v-.75c0-1.517-1.233-2.75-2.75-2.75H4.25c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75H13.75c1.517,0,2.75-1.233,2.75-2.75v-.75h-2.5c-1.654,0-3-1.346-3-3Z"
          fill="currentColor"
        />
        <path
          d="M16.5,11h-2.5c-.828,0-1.5-.672-1.5-1.5h0c0-.828,.672-1.5,1.5-1.5h2.5c.552,0,1,.448,1,1v1c0,.552-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default wallet2;
