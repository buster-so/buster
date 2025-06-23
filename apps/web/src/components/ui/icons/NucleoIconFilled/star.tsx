import type { iconProps } from './iconProps';

function star(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px star';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.95,4.323c-.12-.371-.435-.635-.818-.69l-2.918-.424-1.304-2.641c-.344-.699-1.477-.698-1.82-.001l-1.304,2.643-2.917.424c-.385.055-.699.32-.819.69-.12.37-.021.769.257,1.04l2.111,2.058-.499,2.905c-.065.383.089.763.402.991.313.229.725.26,1.069.079l2.609-1.372,2.61,1.372c.149.078.311.117.472.117.21,0,.419-.066.597-.196.313-.229.468-.608.402-.991l-.499-2.905,2.11-2.058c.279-.271.378-.67.258-1.04Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default star;
