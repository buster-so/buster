import type { iconProps } from './iconProps';

function msgSmile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px msg smile';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9c0,1.397,.371,2.778,1.062,3.971,.238,.446-.095,2.002-.842,2.749-.209,.209-.276,.522-.17,.798,.105,.276,.364,.465,.659,.481,.079,.004,.16,.006,.242,.006,1.145,0,2.534-.407,3.44-.871,.675,.343,1.39,.587,2.131,.727,.484,.092,.981,.138,1.478,.138,4.411,0,8-3.589,8-8S13.411,1,9,1Zm3.529,11.538c-.944,.943-2.198,1.462-3.529,1.462s-2.593-.522-3.539-1.47c-.292-.293-.292-.768,0-1.061,.294-.293,.77-.292,1.062,0,1.322,1.326,3.621,1.328,4.947,.006,.293-.294,.768-.292,1.061,0,.292,.293,.292,.768-.002,1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default msgSmile;
