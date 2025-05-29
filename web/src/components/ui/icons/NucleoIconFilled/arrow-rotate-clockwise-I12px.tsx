import type { iconProps } from './iconProps';

function arrowRotateClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow rotate clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,17c-4.411,0-8-3.589-8-8S4.589,1,9,1c3.164,0,6.037,1.87,7.318,4.764,.168,.379-.003,.822-.382,.989-.379,.168-.821-.003-.989-.382-1.042-2.352-3.376-3.872-5.947-3.872-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5c2.155,0,4.167-1.066,5.38-2.851,.233-.344,.701-.431,1.042-.199,.343,.232,.432,.699,.199,1.042-1.493,2.197-3.967,3.508-6.62,3.508Z"
          fill="currentColor"
        />
        <path
          d="M15.713,7c-.034,0-.069-.002-.104-.007l-2.944-.407c-.411-.057-.697-.436-.641-.846,.057-.41,.437-.693,.846-.641l2.201,.305,.305-2.202c.056-.41,.428-.699,.846-.64,.41,.057,.697,.435,.64,.846l-.408,2.945c-.052,.375-.373,.647-.742,.647Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowRotateClockwise;
