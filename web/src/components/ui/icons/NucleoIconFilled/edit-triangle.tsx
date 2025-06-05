import type { iconProps } from './iconProps';

function editTriangle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px edit triangle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.499,13c-.137,0-.274-.037-.398-.115-.351-.221-.456-.684-.235-1.035L7.003,5.28c.221-.35,.684-.456,1.034-.235,.351,.221,.456,.684,.235,1.035l-4.138,6.57c-.143,.226-.387,.35-.636,.35Z"
          fill="currentColor"
        />
        <path
          d="M14.501,13c-.249,0-.493-.124-.636-.35l-4.138-6.57c-.221-.351-.115-.814,.235-1.035,.35-.221,.813-.115,1.034,.235l4.138,6.57c.221,.351,.115,.814-.235,1.035-.124,.078-.262,.115-.398,.115Z"
          fill="currentColor"
        />
        <path
          d="M13,15H5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H13c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="6.75" y="1.5" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="1" y="12" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="12.5" y="12" />
      </g>
    </svg>
  );
}

export default editTriangle;
