import type { iconProps } from './iconProps';

function chartBarTrendUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart bar trend up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="14" width="4" fill="currentColor" rx="1.75" ry="1.75" x="12.5" y="2" />
        <rect height="9" width="4" fill="currentColor" rx="1.75" ry="1.75" x="7" y="7" />
        <rect height="5" width="4" fill="currentColor" rx="1.75" ry="1.75" x="1.5" y="11" />
        <path
          d="M2.75,9.5c.192,0,.384-.073,.53-.22l4.72-4.72v.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.689L2.22,8.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartBarTrendUp;
