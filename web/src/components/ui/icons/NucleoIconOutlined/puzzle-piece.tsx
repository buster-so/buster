import type { iconProps } from './iconProps';

function puzzlePiece(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px puzzle piece';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.75,8.25c.372,0,.716,.118,1,.317v-2.317c0-1.104-.895-2-2-2h-2.317c.198-.284,.317-.627,.317-1,0-.967-.784-1.75-1.75-1.75s-1.75,.783-1.75,1.75c0,.373,.118,.716,.317,1h-2.317c-1.105,0-2,.896-2,2v2.317c-.284-.198-.628-.317-1-.317-.966,0-1.75,.783-1.75,1.75s.784,1.75,1.75,1.75c.372,0,.716-.118,1-.317v2.317c0,1.104,.895,2,2,2h2.317c-.198-.284-.317-.627-.317-1,0-.967,.784-1.75,1.75-1.75s1.75,.783,1.75,1.75c0,.373-.118,.716-.317,1h2.317c1.105,0,2-.896,2-2v-2.317c-.284,.198-.628,.317-1,.317-.966,0-1.75-.783-1.75-1.75s.784-1.75,1.75-1.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default puzzlePiece;
