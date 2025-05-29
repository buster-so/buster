import type { iconProps } from './iconProps';

function selectObj(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px select obj';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,13c-.414,0-.75-.336-.75-.75V5.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M8.594,15h-2.844c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.844c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,9.344c-.414,0-.75-.336-.75-.75v-2.844c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.844c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,4.5H5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M17.295,11.57l-6.854-2.504c-.396-.144-.828-.049-1.126,.249-.298,.298-.394,.73-.249,1.126l2.504,6.854c.155,.424,.558,.705,1.008,.705,.007,0,.015,0,.022,0,.458-.009,.86-.309,1-.746l.886-2.769,2.769-.886c.437-.14,.736-.542,.746-1s-.273-.872-.704-1.03Z"
          fill="currentColor"
        />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="1.5" y="12" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="1.5" y="1.5" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="12" y="1.5" />
      </g>
    </svg>
  );
}

export default selectObj;
