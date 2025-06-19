import type { iconProps } from './iconProps';

function refreshClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px refresh clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.274,5.451c-.422-.028-.763.307-.777.721-.092,2.427-2.066,4.328-4.497,4.328-1.311,0-2.516-.556-3.356-1.5h1.606c.414,0,.75-.336.75-.75s-.336-.75-.75-.75H1.25c-.414,0-.75.336-.75.75v3c0,.414.336.75.75.75s.75-.336.75-.75v-.784c1.078.97,2.483,1.534,4,1.534,3.24,0,5.874-2.535,5.995-5.771.016-.414-.307-.762-.721-.778Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,0c-.414,0-.75.336-.75.75v.784c-1.078-.97-2.483-1.534-4-1.534C2.76,0,.126,2.535.005,5.771c-.016.414.307.762.721.778.01,0,.02,0,.029,0,.4,0,.733-.317.748-.722.092-2.427,2.066-4.328,4.497-4.328,1.311,0,2.516.556,3.356,1.5h-1.606c-.414,0-.75.336-.75.75s.336.75.75.75h3c.414,0,.75-.336.75-.75V.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default refreshClockwise;
