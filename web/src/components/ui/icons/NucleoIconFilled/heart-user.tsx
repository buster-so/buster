import type { iconProps } from './iconProps';

function heartUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="13.25" cy="11.75" fill="currentColor" r="1.75" />
        <path
          d="M8.54,15.856c.362-1.038,1.046-1.894,1.911-2.484-.279-.479-.451-1.029-.451-1.622,0-1.792,1.458-3.25,3.25-3.25,1.14,0,2.141,.593,2.721,1.484,.475-1.007,.779-2.129,.779-3.372,.01-2.528-2.042-4.597-4.586-4.612-1.195,.015-2.324,.491-3.164,1.306-.841-.815-1.972-1.291-3.179-1.306-2.529,.015-4.581,2.084-4.571,4.609,0,5.254,5.307,8.43,6.933,9.278,.104,.054,.214,.09,.325,.122,.014-.051,.016-.103,.033-.153Z"
          fill="currentColor"
        />
        <path
          d="M13.25,14c-1.48,0-2.803,.943-3.292,2.346-.13,.375-.068,.795,.164,1.122,.237,.333,.621,.532,1.027,.532h4.201c.406,0,.79-.199,1.027-.532,.232-.327,.294-.747,.163-1.123-.488-1.403-1.811-2.346-3.291-2.346Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default heartUser;
