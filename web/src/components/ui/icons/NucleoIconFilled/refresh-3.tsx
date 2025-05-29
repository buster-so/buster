import type { iconProps } from './iconProps';

function refresh3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px refresh 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75,12c-.414,0-.75-.336-.75-.75v-.795c-1.092.974-2.515,1.545-4,1.545C2.76,12,.126,9.465.005,6.229c-.016-.414.307-.762.721-.778.419-.009.763.307.777.721.092,2.427,2.066,4.328,4.497,4.328,1.709,0,3.31-1.013,4.076-2.58.153-.313.501-.481.843-.401.34.079.581.381.581.73v3c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.245,6.549c-.4,0-.733-.317-.748-.722-.092-2.427-2.066-4.328-4.497-4.328-1.709,0-3.31,1.013-4.076,2.58-.153.313-.5.481-.843.401-.34-.079-.581-.381-.581-.73V.75c0-.414.336-.75.75-.75s.75.336.75.75v.795c1.092-.974,2.515-1.545,4-1.545,3.24,0,5.874,2.535,5.995,5.771.016.414-.307.762-.721.778-.01,0-.02,0-.029,0Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default refresh3;
