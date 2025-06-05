import type { iconProps } from './iconProps';

function gridLayoutRows3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid layout rows 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="4" width="14" fill="currentColor" rx="1.75" ry="1.75" x="2" y="7" />
        <rect height="4" width="14" fill="currentColor" rx="1.75" ry="1.75" x="2" y="1.5" />
        <rect height="4" width="14" fill="currentColor" rx="1.75" ry="1.75" x="2" y="12.5" />
      </g>
    </svg>
  );
}

export default gridLayoutRows3;
