import type { iconProps } from './iconProps';

function burger2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px burger 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.078,6.81c-.378-1.446-1.729-4.81-6.078-4.81h-2C3.651,2,2.301,5.364,1.922,6.81c-.059,.225-.01,.464,.132,.648,.142,.184,.361,.292,.594,.292H15.352c.232,0,.452-.108,.594-.292,.142-.184,.19-.423,.132-.648Zm-8.828-.56c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm3.5-.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.75,16H6.25c-2.083,0-3.087-.863-3.564-1.588-.228-.346-.132-.811,.214-1.039,.346-.227,.812-.132,1.039,.214,.393,.597,1.192,.912,2.311,.912h5.5c1.119,0,1.918-.315,2.311-.912,.228-.346,.693-.441,1.039-.214,.346,.228,.442,.692,.214,1.039-.477,.725-1.481,1.588-3.564,1.588Z"
          fill="currentColor"
        />
        <path
          d="M15.25,9h-1.75l-1.61,2.012c-.2,.25-.581,.25-.781,0l-1.61-2.012H2.75c-.965,0-1.75,.785-1.75,1.75s.785,1.75,1.75,1.75H15.25c.965,0,1.75-.785,1.75-1.75s-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default burger2;
