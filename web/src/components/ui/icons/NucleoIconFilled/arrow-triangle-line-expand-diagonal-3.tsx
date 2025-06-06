import type { iconProps } from './iconProps';

function arrowTriangleLineExpandDiagonal3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow triangle line expand diagonal 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.125,13.625c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l7.75-7.75c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-7.75,7.75c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M3.707,10.396c-.287-.287-.713-.372-1.09-.217-.375,.155-.617,.518-.617,.924v3.896c0,.551,.449,1,1,1h3.896c.406,0,.769-.242,.924-.617s.07-.803-.217-1.09l-3.896-3.896Z"
          fill="currentColor"
        />
        <path
          d="M15,2h-3.896c-.406,0-.769,.242-.924,.617s-.07,.803,.217,1.09l3.896,3.896c.192,.192,.446,.293,.706,.293,.129,0,.259-.025,.384-.077,.375-.155,.617-.518,.617-.924V3c0-.551-.449-1-1-1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowTriangleLineExpandDiagonal3;
