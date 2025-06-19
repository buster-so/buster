import type { iconProps } from './iconProps';

function gearArrowRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gear arrow right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="currentColor"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 12.25L16.75 14.75 14.25 17.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.5 14.75L11.75 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.718,10.238c.318-.169.532-.503.532-.883v-.71c0-.51-.383-.938-.89-.994l-1.094-.122c-.226-.546-.277-.668-.503-1.214l.688-.859c.318-.397.286-.971-.074-1.332l-.502-.502c-.36-.36-.934-.392-1.332-.074l-.859.688c-.546-.226-.668-.277-1.214-.503l-.122-1.094c-.056-.506-.484-.89-.994-.89h-.71c-.51,0-.938.383-.994.89l-.122,1.094c-.546.226-.668.276-1.214.503l-.859-.688c-.398-.318-.971-.287-1.332.074l-.502.502c-.36.36-.392.934-.074,1.332l.688.859c-.226.546-.277.668-.503,1.214l-1.094.122c-.506.056-.89.484-.89.994v.71c0,.509.383.938.89.994l1.094.122c.226.546.277.668.503,1.214l-.687.859c-.318.397-.287.971.074,1.332l.502.502c.36.36.934.392,1.332.074l.859-.688c.546.226.668.277,1.214.503l.122,1.094c.056.506.484.89.994.89h.71c.124,0,.242-.024.352-.066"
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

export default gearArrowRight;
