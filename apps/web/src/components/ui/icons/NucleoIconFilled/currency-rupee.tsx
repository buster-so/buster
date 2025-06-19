import type { iconProps } from './iconProps';

function currencyRupee(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px currency rupee';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,6.5H5.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.25,16c-.215,0-.428-.092-.577-.27l-5-6c-.187-.224-.227-.535-.103-.798,.124-.263,.388-.432,.679-.432h1.75c1.378,0,2.5-1.122,2.5-2.5s-1.122-2.5-2.5-2.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c2.206,0,4,1.794,4,4s-1.794,4-4,4h-.149l3.975,4.77c.265,.318,.222,.791-.096,1.056-.14,.117-.311,.174-.479,.174Z"
          fill="currentColor"
        />
        <path
          d="M12.75,3.5H5.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default currencyRupee;
