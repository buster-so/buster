import type { iconProps } from './iconProps';

function suitClubs(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suit clubs';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.905,15.516c-2.001-.423-4.155-2.095-4.155-4.766,0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,2.671-2.154,4.343-4.155,4.766-.375,.08-.63,.43-.591,.812,.04,.382,.362,.672,.746,.672H13.75c.384,0,.706-.29,.746-.672,.04-.382-.215-.732-.591-.812Z"
          fill="currentColor"
        />
        <path
          d="M12.999,5.07c0-.023,0-.047,0-.07,0-2.206-1.794-4-4-4s-4,1.794-4,4c0,.023,0,.047,0,.07-1.849,.352-3.251,1.98-3.251,3.93,0,2.206,1.794,4,4,4,1.337,0,2.523-.66,3.25-1.67,.727,1.011,1.913,1.67,3.25,1.67,2.206,0,4-1.794,4-4,0-1.95-1.402-3.578-3.251-3.93Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitClubs;
