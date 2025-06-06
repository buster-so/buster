import type { iconProps } from './iconProps';

function bottle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bottle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25,10h-3.25v4h3.25c.414,0,.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M11.5,6.189V2.25c0-.965-.785-1.75-1.75-1.75h-1.5c-.965,0-1.75,.785-1.75,1.75v3.939c-1.095,.426-2.5,1.552-2.5,3.811v5.75c0,.965,.785,1.75,1.75,1.75h6.5c.965,0,1.75-.785,1.75-1.75v-5.75c0-2.259-1.405-3.385-2.5-3.811Zm1,9.561c0,.138-.112,.25-.25,.25H5.75c-.138,0-.25-.112-.25-.25v-5.75c0-2.09,1.692-2.475,1.879-2.511,.359-.063,.621-.375,.621-.739v-1.75h2v1.75c0,.36,.262,.67,.615,.738,.193,.037,1.885,.422,1.885,2.512v5.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bottle;
