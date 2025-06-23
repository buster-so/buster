import type { iconProps } from './iconProps';

function currencyEuro(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px currency euro';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,8H3.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H11.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.5,11.5H3.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.5,16c-3.032,0-5.5-3.14-5.5-7S7.468,2,10.5,2c1.062,0,2.09,.382,2.975,1.104,.32,.262,.368,.735,.106,1.056-.263,.321-.735,.368-1.056,.106-.613-.501-1.313-.766-2.025-.766-2.206,0-4,2.467-4,5.5s1.794,5.5,4,5.5c.712,0,1.412-.265,2.025-.766,.32-.261,.793-.214,1.056,.106,.262,.321,.214,.793-.106,1.056-.885,.722-1.913,1.104-2.975,1.104Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default currencyEuro;
