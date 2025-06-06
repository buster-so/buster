import type { iconProps } from './iconProps';

function suitcaseUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.931,15.856c.362-1.038,1.046-1.894,1.911-2.484-.279-.479-.451-1.029-.451-1.622,0-1.792,1.458-3.25,3.25-3.25,.931,0,1.766,.399,2.359,1.029v-2.779c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h6.15c.014-.048,.015-.097,.031-.144Z"
          fill="currentColor"
        />
        <path
          d="M14.641,14c-1.48,0-2.803,.943-3.292,2.346-.13,.375-.068,.795,.164,1.122,.237,.333,.621,.532,1.027,.532h4.201c.406,0,.79-.199,1.027-.532,.232-.327,.294-.747,.163-1.123-.488-1.403-1.811-2.346-3.291-2.346Z"
          fill="currentColor"
        />
        <circle cx="14.641" cy="11.75" fill="currentColor" r="1.75" />
      </g>
    </svg>
  );
}

export default suitcaseUser;
