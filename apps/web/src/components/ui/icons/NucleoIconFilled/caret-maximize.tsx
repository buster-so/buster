import type { iconProps } from './iconProps';

function caretMaximize(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret maximize';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.396,2H3c-.551,0-1,.449-1,1v3.396c0,.406,.242,.769,.617,.924,.125,.052,.255,.077,.384,.077,.26,0,.514-.102,.706-.293l3.396-3.396c.287-.287,.372-.715,.217-1.09s-.518-.617-.924-.617Z"
          fill="currentColor"
        />
        <path
          d="M15,2h-3.396c-.406,0-.769,.242-.924,.617s-.07,.803,.217,1.09l3.396,3.396c.192,.192,.446,.293,.706,.293,.129,0,.259-.025,.384-.077,.375-.155,.617-.518,.617-.924V3c0-.551-.449-1-1-1Z"
          fill="currentColor"
        />
        <path
          d="M15.383,10.68c-.375-.156-.802-.07-1.09,.217l-3.396,3.396c-.287,.287-.372,.715-.217,1.09s.518,.617,.924,.617h3.396c.551,0,1-.449,1-1v-3.396c0-.406-.242-.769-.617-.924Z"
          fill="currentColor"
        />
        <path
          d="M3.707,10.896c-.287-.287-.714-.372-1.09-.217-.375,.155-.617,.518-.617,.924v3.396c0,.551,.449,1,1,1h3.396c.406,0,.769-.242,.924-.617s.07-.803-.217-1.09l-3.396-3.396Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default caretMaximize;
